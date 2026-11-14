import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { PaymentMethodDto } from './dto/process-payment.dto';

// UT-T06: PaymentsService - Idempotency & điều kiện thanh toán (FR-06, ADR-004)
describe('UT-T06 PaymentsService', () => {
  let service: PaymentsService;
  const prisma = { payment: { findUnique: jest.fn() }, $transaction: jest.fn() };
  const ordersService = { findById: jest.fn(), findOwnedBy: jest.fn() };
  const productsService = { deductStockWithOptimisticLock: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrdersService, useValue: ordersService },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  const dto = { orderId: 'ord_1', method: PaymentMethodDto.MOMO, amount: 35000 };

  const pendingOrder = {
    id: 'ord_1',
    orderCode: 'ORD-100001',
    userId: 'usr_1',
    status: 'PENDING',
    finalAmount: 35000,
    items: [{ productId: 'prod_cf_01', qty: 1 }],
  };

  it('từ chối khi thiếu Idempotency-Key', async () => {
    await expect(service.processPayment(dto, 'usr_1')).rejects.toThrow(BadRequestException);
  });

  it('key đã xử lý thì trả lại kết quả cũ, không chạy transaction mới', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay_1',
      orderId: 'ord_1',
      idempotencyKey: 'k1',
      amount: 35000,
      method: 'MOMO',
      status: 'SUCCESS',
      transactionRef: 'TXN-1',
    });
    ordersService.findOwnedBy.mockResolvedValue({ ...pendingOrder, status: 'PAID' });
    ordersService.findById.mockResolvedValue({ ...pendingOrder, status: 'PAID' });

    const res = await service.processPayment(dto, 'usr_1', 'k1');
    expect(res.idempotentReplay).toBe(true);
    expect(res.paymentId).toBe('pay_1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('từ chối thanh toán đơn đã PAID', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    ordersService.findOwnedBy.mockResolvedValue({ ...pendingOrder, status: 'PAID' });
    await expect(service.processPayment(dto, 'usr_1', 'k2')).rejects.toThrow(BadRequestException);
  });

  it('key đã dùng cho đơn khác thì trả 409, không replay kết quả của đơn kia', async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: 'pay_9', orderId: 'ord_other', status: 'SUCCESS' });
    ordersService.findOwnedBy.mockResolvedValue(pendingOrder);
    await expect(service.processPayment(dto, 'usr_1', 'k3')).rejects.toThrow(ConflictException);
  });

  it('đơn đã bị giao dịch khác thanh toán trong lúc chờ thì 409 và không trừ kho', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    ordersService.findOwnedBy.mockResolvedValue(pendingOrder);
    const tx = { order: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } };
    prisma.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx));

    await expect(service.processPayment(dto, 'usr_1', 'k4')).rejects.toThrow(ConflictException);
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: { in: ['PENDING', 'PAYMENT_FAILED'] } },
      data: { status: 'PAID' },
    });
    expect(productsService.deductStockWithOptimisticLock).not.toHaveBeenCalled();
  });
});
