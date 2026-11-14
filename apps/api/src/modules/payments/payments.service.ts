import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { OrderRecord, OrdersService, PAYABLE_STATUSES } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { OrderStatus, assertTransition } from '../orders/order-state-machine';

// Mỗi 10.000đ thanh toán = 1 điểm loyalty
const VND_PER_POINT = 10000;

function newTransactionRef(): string {
  return `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  async processPayment(dto: ProcessPaymentDto, userId: string, headerKey?: string) {
    const idempotencyKey = dto.idempotencyKey || headerKey;
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Yêu cầu thanh toán thiếu Idempotency-Key (Header "Idempotency-Key" hoặc trường "idempotencyKey")',
      );
    }

    // 1. Lấy đơn hàng của chính khách đang thanh toán (đơn người khác trả 404)
    const order = await this.ordersService.findOwnedBy(dto.orderId, userId);

    // 2. Kiểm tra Idempotency: key đã được xử lý thì trả lại kết quả cũ
    const existingPayment = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existingPayment) {
      return this.replay(existingPayment, order);
    }

    // Đơn hàng chỉ được phép thanh toán khi ở trạng thái PENDING hoặc PAYMENT_FAILED (thử lại)
    if (!PAYABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Đơn hàng "${order.orderCode}" đang ở trạng thái "${order.status}", không thể thanh toán tiếp.`,
      );
    }

    try {
      // 3. Cổng thanh toán mô phỏng trả lỗi
      if (dto.simulateFailure) {
        const failed = await this.prisma.$transaction(async (tx) => {
          assertTransition(order.status, OrderStatus.PAYMENT_FAILED);
          await this.claimOrder(tx, order, OrderStatus.PAYMENT_FAILED);
          return tx.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey,
              amount: order.finalAmount,
              method: dto.method,
              status: PaymentStatus.FAILED,
              transactionRef: newTransactionRef(),
            },
          });
        });

        return {
          idempotentReplay: false,
          paymentId: failed.id,
          orderId: order.id,
          orderCode: order.orderCode,
          status: 'FAILED',
          orderStatus: OrderStatus.PAYMENT_FAILED,
          message: 'Giao dịch thanh toán thất bại (Mô phỏng lỗi từ cổng thanh toán)',
        };
      }

      // 4. Thanh toán thành công: trừ kho + đổi trạng thái + cộng điểm + ghi Payment
      //    trong cùng một transaction; bất kỳ bước nào lỗi thì rollback toàn bộ.
      const pointsToAdd = Math.floor(order.finalAmount / VND_PER_POINT);
      const { payment, totalLoyaltyPoints } = await this.prisma.$transaction(async (tx) => {
        // Đổi trạng thái trước: request song song khác cho cùng đơn sẽ bị chặn tại đây
        assertTransition(order.status, OrderStatus.PAID);
        await this.claimOrder(tx, order, OrderStatus.PAID);

        for (const item of order.items) {
          await this.productsService.deductStockWithOptimisticLock(tx, item.productId, item.qty);
        }

        const user = await tx.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: pointsToAdd } },
        });
        if (pointsToAdd > 0) {
          await tx.loyaltyTransaction.create({
            data: { userId: order.userId, orderId: order.id, points: pointsToAdd },
          });
        }

        const created = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.finalAmount,
            method: dto.method,
            status: PaymentStatus.SUCCESS,
            transactionRef: newTransactionRef(),
          },
        });
        return { payment: created, totalLoyaltyPoints: user.loyaltyPoints };
      });

      return {
        idempotentReplay: false,
        paymentId: payment.id,
        orderId: order.id,
        orderCode: order.orderCode,
        transactionRef: payment.transactionRef,
        amount: payment.amount,
        method: payment.method,
        status: 'SUCCESS',
        orderStatus: OrderStatus.PAID,
        loyaltyPointsAdded: pointsToAdd,
        totalLoyaltyPoints,
        message: `Thanh toán thành công qua ${dto.method}. Đơn hàng đã chuyển sang trạng thái PAID!`,
      };
    } catch (e) {
      // Hai request cùng key chạy song song: request về sau trả lại kết quả của request trước
      const winner = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
      if (winner) {
        return this.replay(winner, order);
      }
      throw e;
    }
  }

  /**
   * Đổi trạng thái đơn chỉ khi đơn vẫn đang chờ thanh toán. UPDATE có điều kiện sẽ khóa dòng
   * Order, nên hai giao dịch thanh toán cùng một đơn (khác Idempotency-Key) không thể cùng thành công.
   */
  private async claimOrder(
    tx: Prisma.TransactionClient,
    order: OrderRecord,
    status: OrderStatus,
  ): Promise<void> {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: { in: PAYABLE_STATUSES } },
      data: { status },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        `Đơn hàng "${order.orderCode}" đã được thanh toán hoặc thay đổi trạng thái bởi giao dịch khác.`,
      );
    }
  }

  private async replay(payment: Payment, order: OrderRecord) {
    if (payment.orderId !== order.id) {
      throw new ConflictException(
        'Idempotency-Key này đã được dùng cho một đơn hàng khác. Vui lòng tạo key mới.',
      );
    }
    this.logger.log(
      `[Idempotency Hit] Giao dịch với key "${payment.idempotencyKey}" đã được xử lý trước đó. Trả lại kết quả cũ.`,
    );
    const current = await this.ordersService.findById(order.id);
    return {
      idempotentReplay: true,
      paymentId: payment.id,
      orderId: payment.orderId,
      orderCode: current.orderCode,
      transactionRef: payment.transactionRef,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      orderStatus: current.status,
      message: 'Giao dịch đã được ghi nhận trước đó (Idempotent Replay)',
    };
  }
}
