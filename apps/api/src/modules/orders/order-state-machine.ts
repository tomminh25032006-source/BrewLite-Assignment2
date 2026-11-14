import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export { OrderStatus };

/**
 * Ma trận chuyển đổi trạng thái hợp lệ của đơn hàng:
 * PENDING -> PAID, PAYMENT_FAILED, CANCELLED
 * PAYMENT_FAILED -> PAID (thử lại thành công), PAYMENT_FAILED (thử lại vẫn lỗi), CANCELLED
 * PAID -> PREPARING, CANCELLED
 * PREPARING -> READY
 * READY -> COMPLETED
 * COMPLETED & CANCELLED: Trạng thái kết thúc, không được phép chuyển tiếp
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Hàm assertTransition:
 * Chặn đứng mọi hành vi chuyển trạng thái không hợp lệ (ADR-002)
 */
export function assertTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new BadRequestException(
      `[State Machine Error] Chuyển đổi trạng thái không hợp lệ: Không thể chuyển từ "${currentStatus}" sang "${targetStatus}".`,
    );
  }
}
