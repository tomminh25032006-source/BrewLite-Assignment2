# BIÊN BẢN SPRINT REVIEW VÀ SPRINT RETROSPECTIVE
## DỰ ÁN: BREWLITE – CASHLESS COFFEE ORDERING SYSTEM
> **Mã tài liệu:** `SCRUM-DOC-01` | **Phiên bản:** VER 1.1  
> **Thuộc nhiệm vụ:** Task 5.4 – Triển khai và bàn giao (Assignment 2)  
> **Môn học:** Công nghệ Phần mềm — Khoa CNTT, Trường Đại học Sài Gòn (SGU)  
> **Backlog:** [`requirements/user-stories.md`](./requirements/user-stories.md)

> Sprint Review và Retrospective của cả hai Sprint được tổ chức chung trong một buổi họp ngày 14/11/2026, sau khi phiên bản production đầu tiên chạy ổn định.

---

## SPRINT 1 – Nền tảng kỹ thuật và MVP xem menu

### 1.1. Sprint Review
- **Thời gian:** 22:00 ngày 14/11/2026 (họp chung Review/Retrospective Sprint 1 và Sprint 2)
- **Thành phần tham dự:** Lê Đặng Hoàng Minh (Product Owner), Trương Đại Phát (Scrum Master), Huỳnh Thành Nhân, Nguyễn Thanh Thiện (Development Team) – họp online
- **Sprint Goal:** tạo nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản và MVP đầu tiên chạy được cho luồng xem menu.

| Hạng mục | Kết quả | Minh chứng |
| :--- | :--- | :--- |
| US-01 Xem menu | `GET /api/products`, `GET /api/products/:id`; trang menu mobile-first có loading, empty, error | API-T01, API-T02, FE-T01 |
| TECH-01 Repository | Cấu trúc `apps/web`, `apps/api`, `docs`; README, `.env.example`, branch strategy, Definition of Done | `README.md` |
| TECH-02 Tài liệu Task 1–3 | SRS, use-case, sơ đồ, kiến trúc, ADR trong `docs/` | `docs/` |
| TECH-03 CI | Install → Lint → Unit Test → Build cho mọi pull request | `.github/workflows/ci.yml`, `docs/ci-evidence.md` |

**Kịch bản demo:** mở `/menu` trên điện thoại, lọc danh mục, tìm món, tắt API để thấy trạng thái lỗi và nút thử lại.

### 1.2. Sprint Retrospective
**Làm tốt**
- Tài liệu yêu cầu (context-and-scope, SRS, use-case) được viết trước khi dựng sơ đồ và code, nên phạm vi MVP rõ ràng.
- Dùng TypeScript cho cả Next.js và NestJS, dễ đọc chéo code giữa frontend và backend.

**Cần cải thiện**
- Cấu trúc thư mục ban đầu (`frontend/`, `backend/`) không đúng yêu cầu đề (`apps/web`, `apps/api`), phải chuyển lại.
- Backend lưu dữ liệu trong mảng trên RAM, khởi động lại là mất đơn; chưa có migration.
- CI ban đầu thiếu bước Lint.
- Một số tài liệu mô tả tính năng chưa có trong code (ví dụ chọn mức đá/đường).

**Action items cho Sprint 2**

| # | Hành động | Người phụ trách | Tiêu chí hoàn thành |
| :---: | :--- | :---: | :--- |
| 1 | Chuyển sang PostgreSQL + Prisma, commit migration và seed | Nguyễn Thanh Thiện | `docker compose up --build` tạo được database từ đầu |
| 2 | Thêm Lint vào CI, bật branch protection | Lê Đặng Hoàng Minh | PR có lint lỗi không merge được |
| 3 | Rà lại tài liệu theo code trước mỗi lần merge | Trương Đại Phát | Mục "cập nhật tài liệu" trong Definition of Done được tick |

---

## SPRINT 2 – Luồng end-to-end, CI/CD và triển khai

### 2.1. Sprint Review
- **Thời gian:** 22:00 ngày 14/11/2026
- **Thành phần tham dự:** Lê Đặng Hoàng Minh (Product Owner), Trương Đại Phát (Scrum Master), Huỳnh Thành Nhân, Nguyễn Thanh Thiện (Development Team) – họp online
- **Sprint Goal:** hoàn thành luồng end-to-end, tự động hóa đóng gói và triển khai một phiên bản production truy cập được.
- **URL production:** [https://brew-lite-assignment2.vercel.app](https://brew-lite-assignment2.vercel.app) · [https://brewlite-api-n0j4.onrender.com/api/health](https://brewlite-api-n0j4.onrender.com/api/health) · **Demo:** trực tiếp trên URL production khi chấm, theo kịch bản bên dưới

| Hạng mục | Kết quả | Minh chứng |
| :--- | :--- | :--- |
| US-02 … US-07 | Tùy chọn size/topping, giỏ hàng, đăng ký/đăng nhập JWT, tạo đơn, thanh toán Ví/Thẻ mô phỏng idempotent, xác nhận và theo dõi đơn | UT-T02 … UT-T06, INT-T01 … INT-T09, INT-T13, INT-T15, E2E-T01 |
| US-08 | Màn hình Barista KDS, chỉ tài khoản `STAFF` | INT-T10, INT-T12, E2E-T02 |
| US-09 … US-11 | Mã giảm giá và điểm loyalty, lịch sử đơn, hủy đơn chưa thanh toán | UT-T07, API-T06, INT-T02, INT-T05, INT-T11, INT-T14, INT-T16 |
| TECH-04 … TECH-06 | PostgreSQL + Prisma, Docker Compose, integration/E2E test, CD (GHCR → Render/Vercel → smoke test → rollback) | `docs/deployment.md`, `.github/workflows/cd.yml` |

Tổng số test tự động: 42 unit test (35 API + 7 web), 24 integration test (HTTP + PostgreSQL), 2 E2E Playwright.

**Kịch bản demo end-to-end (khoảng 5 phút):**
1. Khách mở web trên điện thoại, chọn "Cappuccino Kem Sữa Nghệ Thuật" size L (+12.000đ) và một topping, thêm vào giỏ.
2. Mở giỏ hàng, nhập mã `BREW10`, bấm "Tiến hành Thanh toán", đăng nhập tài khoản khách.
3. Chọn Ví MoMo, bật "mô phỏng giao dịch bị từ chối" → đơn `PAYMENT_FAILED`, giỏ hàng giữ nguyên; tắt mô phỏng và thanh toán lại thành công → trang xác nhận `#ORD-XXXXXX`.
4. Barista đăng nhập `barista@brewlite.vn` ở một máy khác, mở `/staff`, nhận đơn → `PREPARING` → `READY`; trang của khách tự cập nhật trạng thái.
5. Trình bày pipeline CI/CD trên GitHub Actions và health check production.

### 2.2. Sprint Retrospective
**Làm tốt**
- Bước thanh toán chạy trong một transaction (trừ kho, đổi trạng thái, cộng điểm, ghi `Payment`), có integration test chạy trên PostgreSQL thật.
- Pipeline CD tự build image theo commit SHA, deploy, smoke test và rollback.

**Cần cải thiện**
- Khi tự kiểm thử bằng request trực tiếp lên API, nhóm phát hiện các lỗi mà test cũ không bao phủ:
  - endpoint đổi trạng thái đơn không cần đăng nhập, nên đặt được `PAID` mà không thanh toán;
  - nhiều request thanh toán (khác Idempotency-Key) cho cùng một đơn đều thành công;
  - giỏ hàng tính phụ thu size cố định, nên hiển thị lệch với số tiền backend trừ;
  - khách xem được đơn của người khác.

  Tất cả đã được sửa kèm test (INT-T12 … INT-T16, E2E-T02); quyết định ghi tại ADR-008.
- Một sơ đồ (`activity-checkout.svg`) được vẽ tay thay vì xuất từ file `.puml`, nên lệch với file nguồn; đã render lại toàn bộ sơ đồ bằng PlantUML.

**Action items cho phiên bản sau**

| # | Hành động | Người phụ trách | Tiêu chí hoàn thành |
| :---: | :--- | :---: | :--- |
| 1 | Thêm test phân quyền và test chạy song song cho mọi endpoint ghi dữ liệu mới | Trương Đại Phát | Mỗi endpoint ghi dữ liệu có test 401/403/404 |
| 2 | Đẩy trạng thái đơn bằng WebSocket thay cho tự tải lại định kỳ | Huỳnh Thành Nhân | KDS và trang khách cập nhật dưới 1 giây |
| 3 | Kiểm tra mã giảm giá qua API thay vì hardcode ở web | Trương Đại Phát | ✅ Đã làm: `GET /api/promotions/:code` (API-T06, E2E-T01) |
