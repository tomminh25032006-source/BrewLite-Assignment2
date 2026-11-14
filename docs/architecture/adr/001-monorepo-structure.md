# ADR 001: Lựa chọn Cấu trúc Monorepo Quản lý Toàn bộ Hệ thống
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-15  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Đề tài BrewLite bao gồm hai ứng dụng chính: Frontend (`Next.js`) và Backend API (`NestJS`), cùng với Cơ sở dữ liệu (`PostgreSQL`) và tài liệu đồ án (`docs`). Nhóm cần một mô hình lưu trữ mã nguồn giúp:
1. Đảm bảo quy tắc tuần tự của môn học: commit thể hiện rõ các tạo phẩm đi từ Yêu cầu $\rightarrow$ Thiết kế $\rightarrow$ Code $\rightarrow$ Test.
2. Dễ dàng đóng gói và khởi chạy toàn bộ hệ thống bằng một lệnh duy nhất (`docker-compose up`).
3. Đồng bộ hóa kiểu dữ liệu TypeScript dùng chung giữa Frontend và Backend.

## 2. Quyết định (Decision)
Nhóm quyết định áp dụng cấu trúc **Monorepo** trong cùng một Git Repository duy nhất:
- Thư mục `apps/web/`: Ứng dụng Next.js (mobile-first/PWA).
- Thư mục `apps/api/`: Ứng dụng NestJS + Prisma (schema, migrations, seed).
- Thư mục `tests/`: Integration test (`tests/integration`) và E2E test (`tests/e2e`).
- Thư mục `docs/`: Chứa toàn bộ tài liệu đặc tả, sơ đồ và ADRs.
- Thư mục `.github/workflows/`: Chứa pipeline CI/CD kiểm soát chung.
- File `docker-compose.yml` ở thư mục gốc để điều phối toàn bộ dịch vụ.

## 3. Hệ quả (Consequences)
- **Tích cực:** 
  - Toàn bộ nhóm làm việc trên cùng một kho lưu trữ, dễ dàng tạo pull request liên kết giữa thay đổi backend và frontend.
  - Giảng viên chỉ cần clone 1 repository duy nhất và chạy lệnh docker là chạy được toàn bộ bài tập lớn.
  - Đảm bảo tính toàn vẹn của Ma trận truy vết (Traceability Matrix).
- **Tiêu cực:** Pipeline CI cần chạy kiểm tra cho cả frontend và backend, tốn thêm một ít thời gian build. Nhóm đã giải quyết bằng cách thiết lập ma trận job song song trong GitHub Actions.
