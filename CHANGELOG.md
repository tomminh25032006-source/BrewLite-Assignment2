# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-14

Bản phát hành đầu tiên, hoàn thành luồng end-to-end của Sprint 1 và Sprint 2.

### Added
- Menu mobile-first có loading/empty/error, lọc danh mục, tìm kiếm (`GET /api/products`, `GET /api/products/:id`).
- Tùy chọn size và topping; backend tự tính giá theo cấu hình từng món.
- Giỏ hàng lưu localStorage, tính tổng tiền; mã giảm giá `BREW10`, `BREWNEW` kiểm tra ở backend (`GET /api/promotions/:code`).
- Đăng ký, đăng nhập JWT; mật khẩu băm bcrypt; vai trò `CUSTOMER` / `STAFF`.
- Tạo đơn `PENDING` (kiểm tra tồn kho, 409 khi hết hàng); thanh toán Ví/Thẻ mô phỏng với `Idempotency-Key`.
- Thanh toán chạy trong transaction: đổi trạng thái có điều kiện, trừ kho (optimistic locking), cộng điểm, ghi `LoyaltyTransaction` và `Payment`; lỗi thì rollback.
- Trang xác nhận/theo dõi đơn (tự cập nhật trạng thái), lịch sử đơn, khách tự hủy đơn chưa thanh toán (`POST /api/orders/:id/cancel`).
- Màn hình quầy `/staff` chỉ cho tài khoản `STAFF` (`GET /api/orders`, `PATCH /api/orders/:id/status`); hủy đơn đã `PAID` thì hoàn kho và thu hồi điểm.
- PostgreSQL + Prisma: migration, seed dữ liệu mẫu idempotent.
- `GET /api/health` kiểm tra kết nối database và trả commit SHA của bản đang chạy.
- PWA manifest và icon.
- Test: 35 unit test API, 7 test web, 24 integration test (HTTP + PostgreSQL), 2 E2E Playwright.
- Docker image cho web/api, `docker-compose.yml` chạy web + api + PostgreSQL.
- CI: lint → unit test → integration test → build → E2E. CD: image GHCR theo SHA → deploy Render/Vercel → chờ `/api/health` trả đúng commit SHA → smoke test → rollback.

### Security
- `JWT_SECRET` bắt buộc lấy từ biến môi trường, không có giá trị mặc định trong mã nguồn.
- `ValidationPipe` bật `whitelist` và `forbidNonWhitelisted`.
- Chỉ `STAFF` đổi được trạng thái pha chế và không đặt được `PAID`; khách chỉ xem, thanh toán, hủy đơn của chính mình.
- Một đơn chỉ thanh toán thành công một lần dù nhiều request (khác `Idempotency-Key`) chạy song song; key đã dùng cho đơn khác bị từ chối (409).

[1.0.0]: https://github.com/tomminh25032006-source/BrewLite-Assignment2/releases/tag/v1.0.0
