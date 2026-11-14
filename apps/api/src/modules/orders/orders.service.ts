import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth/jwt.strategy';
import { CreateOrderDto } from './dto/create-order.dto';
import { toProductDto } from '../products/products.service';
import { OrderStatus, assertTransition } from './order-state-machine';
import { calculateDiscount, resolveUnitPrice, ToppingOption } from './order-pricing';
import { PromotionsService } from '../promotions/promotions.service';

// Trạng thái còn được phép thanh toán hoặc để khách tự hủy
export const PAYABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED];

export const ORDER_INCLUDE = {
  items: { include: { product: true } },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  size: string;
  selectedToppings: ToppingOption[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  total: number;
  discountAmount: number;
  finalAmount: number;
  promotionCode?: string;
  items: OrderItemDetail[];
  createdAt: Date;
  updatedAt: Date;
}

export function toOrderRecord(order: OrderWithItems): OrderRecord {
  return {
    id: order.id,
    orderCode: order.orderCode,
    userId: order.userId,
    status: order.status,
    total: order.total,
    discountAmount: order.discountAmount,
    finalAmount: order.finalAmount,
    promotionCode: order.promotionCode ?? undefined,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      imageUrl: item.product.imageUrl,
      size: item.size,
      selectedToppings: item.selectedToppings as unknown as ToppingOption[],
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function generateOrderCode(): string {
  return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderRecord> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống, không thể tạo đơn hàng');
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, toProductDto(p)]));

    let total = 0;
    const requestedQty = new Map<string, number>();
    const itemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
      }
      if (!product.isActive) {
        throw new BadRequestException(`Sản phẩm "${product.name}" hiện không mở bán`);
      }

      const { unitPrice, toppings } = resolveUnitPrice(product, item.size, item.toppingIds);
      const lineTotal = unitPrice * item.qty;
      total += lineTotal;
      requestedQty.set(product.id, (requestedQty.get(product.id) ?? 0) + item.qty);

      itemsData.push({
        product: { connect: { id: product.id } },
        size: item.size,
        selectedToppings: toppings as unknown as Prisma.InputJsonValue,
        qty: item.qty,
        unitPrice,
        lineTotal,
      });
    }

    // Kiểm tra tồn kho ngay khi tạo đơn (nhánh "hết hàng" trong Activity Diagram)
    for (const [productId, qty] of requestedQty) {
      const product = productMap.get(productId)!;
      if (product.stock < qty) {
        throw new ConflictException(
          `Sản phẩm "${product.name}" không đủ số lượng tồn kho (Còn lại: ${product.stock}, Yêu cầu: ${qty}).`,
        );
      }
    }

    let discountAmount = 0;
    let promotionCode: string | undefined;
    if (dto.promotionCode) {
      const promo = await this.promotionsService.findUsable(dto.promotionCode);
      promotionCode = promo.code;
      discountAmount = calculateDiscount(total, promo);
    }

    const finalAmount = Math.max(0, total - discountAmount);

    // orderCode sinh ngẫu nhiên; thử lại nếu trùng (unique constraint)
    for (let attempt = 0; ; attempt++) {
      try {
        const order = await this.prisma.order.create({
          data: {
            orderCode: generateOrderCode(),
            user: { connect: { id: userId } },
            status: OrderStatus.PENDING,
            total,
            discountAmount,
            finalAmount,
            promotion: promotionCode ? { connect: { code: promotionCode } } : undefined,
            items: { create: itemsData },
          },
          include: ORDER_INCLUDE,
        });
        return toOrderRecord(order);
      } catch (e) {
        const isCodeClash =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
        if (!isCodeClash || attempt >= 3) {
          throw e;
        }
      }
    }
  }

  // Cập nhật trạng thái qua State Machine với assertTransition
  async updateOrderStatus(orderId: string, targetStatus: OrderStatus): Promise<OrderRecord> {
    if (!Object.values(OrderStatus).includes(targetStatus)) {
      throw new BadRequestException(`Trạng thái "${targetStatus}" không hợp lệ`);
    }
    const order = await this.findById(orderId);

    // Chặn chuyển trạng thái sai bằng assertTransition
    assertTransition(order.status, targetStatus);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Chỉ đổi khi trạng thái chưa bị request khác thay đổi (tránh hoàn kho 2 lần khi hủy song song)
      const result = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: targetStatus },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          `Đơn hàng "${order.orderCode}" vừa thay đổi trạng thái, vui lòng tải lại.`,
        );
      }

      if (targetStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PAID) {
        await this.revertPaidOrder(tx, order);
      }

      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: ORDER_INCLUDE });
    });
    return toOrderRecord(updated);
  }

  /**
   * Đơn đã thanh toán bị nhân viên hủy: kho đã bị trừ và điểm đã được cộng lúc thanh toán,
   * nên phải hoàn lại tồn kho và thu hồi điểm (ghi LoyaltyTransaction số âm). Hoàn tiền nằm ngoài phạm vi (FR-13).
   */
  private async revertPaidOrder(tx: Prisma.TransactionClient, order: OrderRecord): Promise<void> {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty }, version: { increment: 1 } },
      });
    }

    const earned = await tx.loyaltyTransaction.aggregate({
      where: { orderId: order.id },
      _sum: { points: true },
    });
    const points = earned._sum.points ?? 0;
    if (points > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: { loyaltyPoints: { decrement: points } },
      });
      await tx.loyaltyTransaction.create({
        data: { userId: order.userId, orderId: order.id, points: -points },
      });
    }
  }

  // Khách chỉ thấy đơn của chính mình; đơn của người khác trả 404 như không tồn tại
  async findOwnedBy(id: string, userId: string): Promise<OrderRecord> {
    const order = await this.findById(id);
    if (order.userId !== userId) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã ID: ${id}`);
    }
    return order;
  }

  findForUser(id: string, user: AuthUser): Promise<OrderRecord> {
    return user.role === Role.STAFF ? this.findById(id) : this.findOwnedBy(id, user.userId);
  }

  async cancelByCustomer(id: string, userId: string): Promise<OrderRecord> {
    const order = await this.findOwnedBy(id, userId);
    if (!PAYABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Đơn hàng "${order.orderCode}" đang ở trạng thái "${order.status}", không thể hủy.`,
      );
    }

    // Chỉ hủy khi đơn vẫn chưa thanh toán, tránh hủy nhầm đơn vừa được thanh toán song song
    const result = await this.prisma.order.updateMany({
      where: { id: order.id, status: { in: PAYABLE_STATUSES } },
      data: { status: OrderStatus.CANCELLED },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        `Đơn hàng "${order.orderCode}" vừa thay đổi trạng thái, vui lòng tải lại.`,
      );
    }
    return this.findById(order.id);
  }

  async findById(id: string): Promise<OrderRecord> {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id }, { orderCode: id }] },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã ID: ${id}`);
    }
    return toOrderRecord(order);
  }

  async findUserOrders(userId: string): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderRecord);
  }

  // Dành cho màn hình quầy (KDS) của nhân viên: toàn bộ đơn của cửa hàng
  async findAll(): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderRecord);
  }
}
