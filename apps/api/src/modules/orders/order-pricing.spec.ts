import { BadRequestException } from '@nestjs/common';
import { calculateDiscount, PricedProduct, resolveUnitPrice } from './order-pricing';

const latte: PricedProduct = {
  name: 'Cà Phê Sữa Đá',
  price: 35000,
  sizeOptions: [
    { size: 'S', extraPrice: 0 },
    { size: 'M', extraPrice: 5000 },
    { size: 'L', extraPrice: 10000 },
  ],
  toppingOptions: [
    { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
    { id: 'top_02', name: 'Kem Cheese', price: 10000 },
  ],
};

// UT-T02: Tính giá phía backend (FR-02, FR-05)
describe('UT-T02 Order Pricing - resolveUnitPrice', () => {
  it('tính đơn giá = giá gốc + phụ thu size + topping', () => {
    const { unitPrice, toppings } = resolveUnitPrice(latte, 'M', ['top_02']);
    expect(unitPrice).toBe(35000 + 5000 + 10000);
    expect(toppings).toEqual([{ id: 'top_02', name: 'Kem Cheese', price: 10000 }]);
  });

  it('không có topping thì chỉ cộng size', () => {
    expect(resolveUnitPrice(latte, 'L').unitPrice).toBe(45000);
  });

  it('từ chối topping không thuộc sản phẩm', () => {
    expect(() => resolveUnitPrice(latte, 'S', ['top_fake'])).toThrow(BadRequestException);
  });

  it('từ chối size không có trong cấu hình', () => {
    const noLarge = { ...latte, sizeOptions: [{ size: 'S' as const, extraPrice: 0 }] };
    expect(() => resolveUnitPrice(noLarge, 'L')).toThrow(BadRequestException);
  });
});

// UT-T03: Khuyến mãi (FR-09)
describe('UT-T03 Order Pricing - calculateDiscount', () => {
  const brew10 = { code: 'BREW10', discountPercent: 10, maxDiscount: 30000, minOrderValue: 50000 };
  const brewNew = { code: 'BREWNEW', discountPercent: 0, maxDiscount: 15000, minOrderValue: 0 };

  it('BREW10 giảm 10% cho đơn từ 50.000đ', () => {
    expect(calculateDiscount(70000, brew10)).toBe(7000);
  });

  it('BREW10 giảm tối đa 30.000đ', () => {
    expect(calculateDiscount(500000, brew10)).toBe(30000);
  });

  it('BREW10 từ chối đơn dưới 50.000đ', () => {
    expect(() => calculateDiscount(40000, brew10)).toThrow(BadRequestException);
  });

  it('BREWNEW giảm cố định 15.000đ nhưng không vượt tổng đơn', () => {
    expect(calculateDiscount(35000, brewNew)).toBe(15000);
    expect(calculateDiscount(10000, brewNew)).toBe(10000);
  });
});
