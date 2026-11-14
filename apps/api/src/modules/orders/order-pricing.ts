import { BadRequestException } from '@nestjs/common';

export interface SizeOption {
  size: 'S' | 'M' | 'L';
  extraPrice: number;
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface PricedProduct {
  name: string;
  price: number;
  sizeOptions: SizeOption[];
  toppingOptions: ToppingOption[];
}

export interface PromotionRule {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
}

/**
 * Tính đơn giá 1 món hoàn toàn ở backend (FR-05): giá gốc + phụ thu size + giá topping
 * tra từ cấu hình của sản phẩm. Client chỉ gửi mã topping, không gửi giá.
 */
export function resolveUnitPrice(
  product: PricedProduct,
  size: string,
  toppingIds: string[] = [],
): { unitPrice: number; toppings: ToppingOption[] } {
  const sizeOption = product.sizeOptions.find((s) => s.size === size);
  if (!sizeOption) {
    throw new BadRequestException(`Sản phẩm "${product.name}" không có size ${size}`);
  }

  const toppings = toppingIds.map((id) => {
    const topping = product.toppingOptions.find((t) => t.id === id);
    if (!topping) {
      throw new BadRequestException(`Topping "${id}" không áp dụng cho "${product.name}"`);
    }
    return topping;
  });

  const toppingsTotal = toppings.reduce((sum, t) => sum + t.price, 0);
  return { unitPrice: product.price + sizeOption.extraPrice + toppingsTotal, toppings };
}

/**
 * Tính số tiền giảm của mã khuyến mãi.
 * discountPercent = 0 nghĩa là giảm cố định bằng maxDiscount.
 */
export function calculateDiscount(total: number, promo: PromotionRule): number {
  if (total < promo.minOrderValue) {
    throw new BadRequestException(
      `Mã ${promo.code} chỉ áp dụng cho đơn hàng từ ${promo.minOrderValue.toLocaleString('vi-VN')}đ trở lên`,
    );
  }
  const discount =
    promo.discountPercent > 0
      ? Math.min(Math.round((total * promo.discountPercent) / 100), promo.maxDiscount)
      : promo.maxDiscount;
  return Math.min(discount, total);
}
