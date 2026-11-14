import { IsIn } from 'class-validator';
import { OrderStatus } from '../order-state-machine';

// Nhân viên quầy (STAFF) chỉ được đổi các trạng thái pha chế hoặc hủy đơn.
// PAID và PAYMENT_FAILED chỉ do PaymentsService đặt sau khi xử lý thanh toán.
export const STAFF_STATUSES = [
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
] as const;

export class UpdateOrderStatusDto {
  @IsIn(STAFF_STATUSES, {
    message: `Trạng thái phải là một trong: ${STAFF_STATUSES.join(', ')}`,
  })
  status: (typeof STAFF_STATUSES)[number];
}
