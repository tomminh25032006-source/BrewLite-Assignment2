# ADR 007: Truy cập Dữ liệu bằng Prisma ORM và Migration được Commit
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-27  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Phiên bản đầu của backend lưu dữ liệu trong mảng trên RAM: khởi động lại là mất đơn hàng, và không có transaction thật để bảo vệ bước thanh toán. Assignment 2 yêu cầu:
- dữ liệu lưu trong PostgreSQL;
- có cơ chế migration (Task 3.1) và migration/seed tái tạo được database (Task 5.2);
- chạy migration an toàn khi triển khai (Task 5.3).

Các phương án đã cân nhắc:

| Phương án | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| SQL thuần (`pg`) | Kiểm soát hoàn toàn câu lệnh | Tự viết migration, tự map kiểu dữ liệu, dễ sai |
| TypeORM | Tích hợp sẵn trong tài liệu NestJS | Migration sinh tự động hay lệch với entity; kiểu trả về kém chặt |
| **Prisma** | Schema khai báo một nơi, client có kiểu chặt, `migrate dev`/`migrate deploy` rõ ràng | Thêm bước `prisma generate`; engine cần OpenSSL trên Alpine |

## 2. Quyết định (Decision)
- Schema duy nhất tại `apps/api/prisma/schema.prisma`; class diagram (`docs/diagrams/class-domain.puml`) được giữ khớp với file này.
- Thay đổi schema bằng `prisma migrate dev --name <ten>` và **commit thư mục `prisma/migrations/`** qua pull request.
- Khi container API khởi động: `prisma migrate deploy` (chỉ áp dụng migration đã commit, không reset dữ liệu) → seed idempotent (`dist-seed/seed.js`, dùng `upsert`, không ghi đè tồn kho) → `node dist/main`.
- Migration viết theo hướng tương thích ngược: thêm cột có giá trị mặc định trước, xóa cột ở bản phát hành sau. Nhờ vậy image `stable` cũ vẫn chạy được sau khi rollback (ví dụ migration `add_user_role` thêm cột `role` có mặc định `CUSTOMER`).
- Các bước cần toàn vẹn dùng `prisma.$transaction`. Optimistic locking (ADR-003) và cập nhật trạng thái có điều kiện (ADR-004) dùng `updateMany` với điều kiện `WHERE` và kiểm tra số dòng bị ảnh hưởng.
- Integration test chạy trên database riêng `brewlite_test`, áp dụng migration bằng `migrate deploy` trước khi chạy.

## 3. Hệ quả (Consequences)
- **Tích cực:**
  - Ai clone repository cũng tạo lại được database giống hệt bằng `docker compose up --build` (migration và seed tự chạy).
  - Lịch sử thay đổi cấu trúc dữ liệu nằm trong git, review được qua pull request.
  - Kiểu dữ liệu TypeScript sinh từ schema, sai tên cột bị phát hiện ngay lúc build.
- **Tiêu cực:**
  - Trường `Json` (`sizeOptions`, `toppingOptions`, `selectedToppings`) không được Prisma kiểm tra kiểu; backend phải tự ép kiểu và kiểm tra khi tính giá.
  - Migration lỗi làm container không khởi động; nhóm dựa vào health check và job `rollback` của CD để phát hiện và quay lại.
