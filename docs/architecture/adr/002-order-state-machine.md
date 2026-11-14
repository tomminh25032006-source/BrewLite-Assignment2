# ADR 002: Quản lý Vòng đời Đơn hàng bằng Máy trạng thái Hữu hạn (Order State Machine)
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-16  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Đơn hàng trong ngành F&B trải qua nhiều trạng thái: Khởi tạo, Chờ thanh toán, Đã thanh toán, Đang pha chế, Sẵn sàng lấy nước, Hoàn tất, Lỗi thanh toán hoặc Đã hủy. Nếu chỉ cập nhật trạng thái tùy ý bằng câu lệnh `UPDATE status = :newStatus` mà không có cơ chế ràng buộc:
- Người dùng hoặc mã độc có thể gửi request nhảy cóc từ `PENDING` sang `COMPLETED` mà không qua thanh toán.
- Nhân viên có thể vô tình chuyển đơn đã hủy `CANCELLED` quay ngược lại chế biến.

## 2. Quyết định (Decision)
Triển khai một **Finite State Machine (FSM)** nghiêm ngặt tại Backend (`order-state-machine.ts`) với hàm chặn tập trung:
```typescript
assertTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): void
```
- Khai báo ma trận chuyển trạng thái cho phép (`ALLOWED_TRANSITIONS`).
- Nếu trạng thái đích không nằm trong danh sách cho phép, lập tức ném lỗi `BadRequestException (400)`.
- Hai trạng thái `COMPLETED` và `CANCELLED` là trạng thái kết thúc (Terminal states), cấm tuyệt đối mọi chuyển tiếp tiếp theo.
- Ai được đổi trạng thái nào (bổ sung sau khi rà soát bảo mật, xem ADR-008):
  - `PAID` và `PAYMENT_FAILED` chỉ do `PaymentsService` đặt sau khi xử lý thanh toán; không endpoint nào cho đặt bằng tay.
  - Nhân viên quầy (`STAFF`) đổi `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` qua `PATCH /api/orders/:id/status` (DTO chỉ nhận 4 giá trị này). Câu `UPDATE` có điều kiện trạng thái cũ để hai request song song không cùng đổi được.
  - Hủy đơn đã `PAID` (kho đã trừ, điểm đã cộng lúc thanh toán) thì trong cùng transaction hoàn lại tồn kho và thu hồi điểm bằng một `LoyaltyTransaction` số âm (INT-T17).
  - Khách chỉ được hủy đơn của chính mình khi đơn đang `PENDING` hoặc `PAYMENT_FAILED` (`POST /api/orders/:id/cancel`).

## 3. Hệ quả (Consequences)
- **Tích cực:** 
  - Triệt tiêu hoàn toàn lỗi logic nhảy cóc trạng thái đơn hàng.
  - Mã nguồn tập trung một nơi, dễ viết unit test bao phủ toàn bộ ma trận chuyển trạng thái (UT-T01) và integration test cho phân quyền (INT-T10, INT-T12).
- **Tiêu cực:** Mọi thay đổi luồng trạng thái mới trong tương lai đều phải cập nhật lại cấu hình ma trận FSM và các test case tương ứng.
