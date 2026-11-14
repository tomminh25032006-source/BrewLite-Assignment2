import { BadRequestException } from '@nestjs/common';
import { assertTransition, OrderStatus } from './order-state-machine';

// UT-T01: Order State Machine (ADR-002, FR-08)
describe('UT-T01 Order State Machine - assertTransition', () => {
  it('cho phép luồng hợp lệ PENDING -> PAID -> PREPARING -> READY -> COMPLETED', () => {
    expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    expect(() => assertTransition(OrderStatus.PAID, OrderStatus.PREPARING)).not.toThrow();
    expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY)).not.toThrow();
    expect(() => assertTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
  });

  it('cho phép thanh toán lỗi, lỗi tiếp và thử lại thành công', () => {
    expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED)).not.toThrow();
    expect(() =>
      assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PAYMENT_FAILED),
    ).not.toThrow();
    expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PAID)).not.toThrow();
  });

  it('chặn nhảy cóc trạng thái PENDING -> COMPLETED', () => {
    expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED)).toThrow(
      BadRequestException,
    );
  });

  it('chặn thay đổi sau khi đơn đã COMPLETED hoặc CANCELLED', () => {
    expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PENDING)).toThrow(
      BadRequestException,
    );
    expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toThrow(
      BadRequestException,
    );
  });
});
