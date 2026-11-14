import { BadRequestException, Injectable } from '@nestjs/common';
import { Promotion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateDiscount } from '../orders/order-pricing';

export interface PromotionQuote {
  code: string;
  description: string;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
}

// Kiểm tra mã giảm giá ở một nơi duy nhất, dùng cho cả tạo đơn và trang giỏ hàng (FR-09)
@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mã không tồn tại, đã tắt hoặc hết hạn trả 400. */
  async findUsable(rawCode: string): Promise<Promotion> {
    const code = rawCode.toUpperCase().trim();
    const promo = await this.prisma.promotion.findUnique({ where: { code } });
    if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < new Date())) {
      throw new BadRequestException(`Mã khuyến mãi "${rawCode}" không tồn tại hoặc đã hết hạn`);
    }
    return promo;
  }

  /** Tính trước số tiền giảm cho tạm tính hiện tại; chưa đủ giá trị tối thiểu trả 400. */
  async quote(rawCode: string, subtotal: number): Promise<PromotionQuote> {
    const promo = await this.findUsable(rawCode);
    const discountAmount = calculateDiscount(subtotal, promo);
    return {
      code: promo.code,
      description: promo.description,
      subtotal,
      discountAmount,
      finalAmount: Math.max(0, subtotal - discountAmount),
    };
  }
}
