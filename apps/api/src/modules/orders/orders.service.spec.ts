import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PromotionsService } from '../promotions/promotions.service';
import { PrismaService } from '../../prisma/prisma.service';

const product = {
  id: 'prod_cf_01',
  name: 'Cà Phê Sữa Đá',
  category: 'COFFEE',
  price: 35000,
  imageUrl: 'https://example.com/cf.jpg',
  description: '',
  stock: 3,
  version: 0,
  isActive: true,
  sizeOptions: [
    { size: 'S', extraPrice: 0 },
    { size: 'M', extraPrice: 5000 },
  ],
  toppingOptions: [{ id: 'top_02', name: 'Kem Cheese', price: 10000 }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// UT-T05: OrdersService.createOrder (FR-05, FR-09)
describe('UT-T05 OrdersService.createOrder', () => {
  let service: OrdersService;
  const prisma = {
    product: { findMany: jest.fn() },
    promotion: { findUnique: jest.fn() },
    order: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.order.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'ord_1',
        orderCode: data.orderCode,
        userId: 'usr_1',
        status: data.status,
        total: data.total,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        promotionCode: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    const module = await Test.createTestingModule({
      providers: [OrdersService, PromotionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(OrdersService);
  });

  it('tạo đơn PENDING với giá do backend tính', async () => {
    const order = await service.createOrder('usr_1', {
      items: [{ productId: 'prod_cf_01', size: 'M', toppingIds: ['top_02'], qty: 2 }],
    });
    expect(order.status).toBe('PENDING');
    expect(order.orderCode).toMatch(/^ORD-\d{6}$/);
    expect(order.total).toBe((35000 + 5000 + 10000) * 2);
    const itemData = prisma.order.create.mock.calls[0][0].data.items.create[0];
    expect(itemData.unitPrice).toBe(50000);
    expect(itemData.selectedToppings).toEqual([{ id: 'top_02', name: 'Kem Cheese', price: 10000 }]);
  });

  it('áp dụng mã khuyến mãi lấy từ bảng Promotion', async () => {
    prisma.promotion.findUnique.mockResolvedValue({
      code: 'BREW10',
      discountPercent: 10,
      maxDiscount: 30000,
      minOrderValue: 50000,
      isActive: true,
      expiresAt: null,
    });
    const order = await service.createOrder('usr_1', {
      items: [{ productId: 'prod_cf_01', size: 'S', qty: 2 }],
      promotionCode: 'brew10',
    });
    expect(order.discountAmount).toBe(7000);
    expect(order.finalAmount).toBe(63000);
  });

  it('từ chối mã khuyến mãi không tồn tại', async () => {
    prisma.promotion.findUnique.mockResolvedValue(null);
    await expect(
      service.createOrder('usr_1', {
        items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }],
        promotionCode: 'FAKE',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('trả 409 khi số lượng đặt vượt tồn kho', async () => {
    await expect(
      service.createOrder('usr_1', {
        items: [
          { productId: 'prod_cf_01', size: 'S', qty: 2 },
          { productId: 'prod_cf_01', size: 'M', qty: 2 },
        ],
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('từ chối topping không thuộc sản phẩm', async () => {
    await expect(
      service.createOrder('usr_1', {
        items: [{ productId: 'prod_cf_01', size: 'S', toppingIds: ['top_fake'], qty: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('trả 404 khi sản phẩm không tồn tại', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await expect(
      service.createOrder('usr_1', { items: [{ productId: 'nope', size: 'S', qty: 1 }] }),
    ).rejects.toThrow(NotFoundException);
  });
});
