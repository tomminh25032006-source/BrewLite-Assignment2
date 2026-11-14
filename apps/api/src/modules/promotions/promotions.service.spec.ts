import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PromotionsService } from './promotions.service';

// UT-T07: kiểm tra mã giảm giá ở backend (FR-09)
describe('PromotionsService', () => {
  const prisma = { promotion: { findUnique: jest.fn() } };
  let service: PromotionsService;

  const brew10 = {
    code: 'BREW10',
    description: 'Giảm 10% tối đa 30.000đ cho đơn từ 50.000đ',
    discountPercent: 10,
    maxDiscount: 30000,
    minOrderValue: 50000,
    isActive: true,
    expiresAt: null,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [PromotionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PromotionsService);
  });

  it('chuẩn hóa mã và tính số tiền giảm theo tạm tính', async () => {
    prisma.promotion.findUnique.mockResolvedValue(brew10);
    const quote = await service.quote(' brew10 ', 60000);
    expect(prisma.promotion.findUnique).toHaveBeenCalledWith({ where: { code: 'BREW10' } });
    expect(quote).toEqual({
      code: 'BREW10',
      description: brew10.description,
      subtotal: 60000,
      discountAmount: 6000,
      finalAmount: 54000,
    });
  });

  it('từ chối mã không tồn tại, đã tắt hoặc hết hạn', async () => {
    prisma.promotion.findUnique.mockResolvedValueOnce(null);
    await expect(service.findUsable('FAKE')).rejects.toBeInstanceOf(BadRequestException);

    prisma.promotion.findUnique.mockResolvedValueOnce({ ...brew10, isActive: false });
    await expect(service.findUsable('BREW10')).rejects.toBeInstanceOf(BadRequestException);

    prisma.promotion.findUnique.mockResolvedValueOnce({ ...brew10, expiresAt: new Date('2020-01-01') });
    await expect(service.findUsable('BREW10')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối khi tạm tính chưa đạt giá trị đơn tối thiểu', async () => {
    prisma.promotion.findUnique.mockResolvedValue(brew10);
    await expect(service.quote('BREW10', 40000)).rejects.toBeInstanceOf(BadRequestException);
  });
});
