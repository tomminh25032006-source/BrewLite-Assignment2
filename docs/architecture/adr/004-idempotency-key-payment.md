# ADR 004: Chống Thanh toán Trùng lặp bằng Cơ chế Idempotency-Key
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-18  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Trong môi trường mạng không dây hoặc mạng di động 4G/5G tại quán cà phê, kết nối có thể bị giật cục hoặc chập chờn. Khi khách hàng bấm "Thanh toán", request có thể đã đến server nhưng kết quả phản hồi chưa kịp về máy khách do timeout. Khách hàng theo thói quen sẽ bấm liên tục nút thanh toán thêm 1 hoặc 2 lần nữa.
- Nếu không có cơ chế chống trùng lặp, khách hàng sẽ bị trừ tiền 2 lần (Double Charging) cho cùng một đơn hàng, gây khiếu nại tài chính nghiêm trọng.

## 2. Quyết định (Decision)
Triển khai cơ chế **Idempotent Payment** theo chuẩn quốc tế (tương tự kiến trúc thanh toán của Stripe và MoMo):
1. **Phía Client:** Trước khi gửi request `POST /api/payments`, Frontend tự sinh một mã ngẫu nhiên duy nhất `Idempotency-Key` chuẩn UUIDv4 và đính kèm trong HTTP Header hoặc Payload.
2. **Phía Backend:** 
   - Kiểm tra xem `idempotencyKey` đã tồn tại trong bảng `Payment` của PostgreSQL hay chưa.
   - Nếu **ĐÃ TỒN TẠI (Idempotency Hit):** Không gọi cổng thanh toán, không trừ tiền lại, không tạo bản ghi mới $\rightarrow$ Lập tức trả về kết quả thành công của giao dịch trước đó kèm cờ `idempotentReplay: true`.
   - Nếu **CHƯA TỒN TẠI:** Xử lý thanh toán bình thường và ghi lưu bản ghi `Payment` với ràng buộc `idempotencyKey UNIQUE` trong CSDL.
   - Key đã tồn tại nhưng thuộc **đơn hàng khác** → trả `409 Conflict`, không replay kết quả của đơn kia (khách có thể tưởng nhầm đơn mới đã được thanh toán).
3. **Nhiều key khác nhau cho cùng một đơn** (ví dụ khách mở 2 tab): Idempotency-Key không chặn được trường hợp này, nên trong transaction thanh toán, backend đổi trạng thái đơn bằng `UPDATE ... WHERE status IN ('PENDING','PAYMENT_FAILED')` **trước** khi trừ kho. Câu lệnh này khóa dòng `Order`; giao dịch đến sau không cập nhật được dòng nào → rollback, trả `409`.

## 3. Hệ quả (Consequences)
- **Tích cực:** 
  - Khách hàng an tâm tuyệt đối, bấm nhiều lần cũng chỉ bị trừ tiền đúng 1 lần duy nhất.
  - Đáp ứng tiêu chí chấp nhận của FR-06: gửi 2 lần cùng Idempotency-Key chỉ tạo 1 giao dịch (INT-T06); một đơn chỉ thanh toán thành công một lần dù nhiều request chạy song song (INT-T13); key của đơn khác bị từ chối (INT-T15).
- **Tiêu cực:** Phải lưu trữ và đánh chỉ mục Unique cho trường `idempotencyKey` trong bảng `Payment`. Dung lượng lưu trữ tăng nhẹ nhưng hoàn toàn chấp nhận được.
