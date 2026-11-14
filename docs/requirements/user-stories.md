# USER STORIES VÀ PRODUCT BACKLOG
## DỰ ÁN: BREWLITE – CASHLESS COFFEE ORDERING SYSTEM
> **Mã tài liệu:** `REQ-DOC-04` | **Phiên bản:** VER 1.0  
> **Thuộc nhiệm vụ:** Task 1.2 (yêu cầu), Task 4.1 (Product Backlog cho Sprint 1 và Sprint 2)  
> **Nguồn:** [`srs.md`](./srs.md) — mỗi user story `US-xx` tương ứng một yêu cầu `FR-xx` cùng số.

Issue board trên GitHub dùng đúng mã `US-xx` làm tiêu đề issue để truy vết từ backlog tới pull request và commit.

---

## 1. TỔNG HỢP BACKLOG THEO SPRINT

| Sprint | Mục tiêu Sprint (Sprint Goal) | User Story |
| :--- | :--- | :--- |
| **Sprint 1** | Tạo nền tảng kỹ thuật (repository, tài liệu, CI) và MVP đầu tiên chạy được cho luồng xem menu. | US-01 |
| **Sprint 2** | Hoàn thành luồng end-to-end Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn, tự động hóa CD và triển khai production. | US-02 … US-11 |
| *Backlog sau* | Phạm vi mở rộng (`context-and-scope.md` §3.2) | US-12 (Won't trong phiên bản này) |

---

## 2. DANH SÁCH USER STORY

| Mã | User Story | FR | Ưu tiên | Sprint | Tiêu chí chấp nhận (tóm tắt) | Test |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| **US-01** | Là **khách hàng**, tôi muốn **xem menu theo danh mục và tìm món theo tên** để **chọn nhanh đồ uống mình thích**. | FR-01 | Must | 1 | Menu hiển thị món đang bán kèm giá, ảnh; lọc danh mục, tìm kiếm; có trạng thái loading, empty, error. | API-T01, API-T02, FE-T01, E2E-T01 |
| **US-02** | Là **khách hàng**, tôi muốn **chọn size và topping và thấy giá cập nhật ngay** để **biết chính xác số tiền trước khi đặt**. | FR-02 | Must | 2 | Giá trên nút "Thêm vào giỏ" đổi theo size/topping, bằng giá backend tính. | UT-T02, FE-T02, INT-T02 |
| **US-03** | Là **khách hàng**, tôi muốn **giỏ hàng được giữ lại khi tải lại trang** để **không phải chọn lại món**. | FR-03 | Must | 2 | Giỏ lưu localStorage; tăng/giảm/xóa món; tổng tiền đúng. | FE-T02, E2E-T01 |
| **US-04** | Là **khách hàng**, tôi muốn **đăng ký và đăng nhập** để **đặt đơn và tích điểm trên tài khoản của mình**. | FR-04 | Must | 2 | Email trùng hoặc mật khẩu < 6 ký tự bị từ chối; đăng nhập nhận JWT. | API-T03, API-T04 |
| **US-05** | Là **khách hàng**, tôi muốn **gửi giỏ hàng thành đơn hàng** để **cửa hàng ghi nhận món tôi đặt**. | FR-05 | Must | 2 | Đơn `PENDING`, mã `ORD-XXXXXX`, giá do backend tính, vượt tồn kho trả 409. | UT-T05, INT-T02, INT-T03, INT-T04 |
| **US-06** | Là **khách hàng**, tôi muốn **thanh toán bằng Ví/Thẻ mà không bị trừ tiền hai lần khi mạng chập chờn** để **yên tâm bấm thanh toán**. | FR-06 | Must | 2 | Thành công → `PAID`; cùng Idempotency-Key chỉ 1 giao dịch; một đơn chỉ thanh toán thành công một lần; lỗi thì giữ giỏ. | UT-T06, INT-T05 … INT-T09, INT-T13, INT-T15, E2E-T01 |
| **US-07** | Là **khách hàng**, tôi muốn **xem mã đơn và trạng thái pha chế cập nhật liên tục** để **biết khi nào ra quầy lấy nước**. | FR-07 | Must | 2 | Trang `/orders/:id` hiển thị mã đơn, timeline, tự cập nhật; người khác không xem được. | INT-T05, INT-T14, E2E-T01, E2E-T02 |
| **US-08** | Là **barista**, tôi muốn **xem các đơn đã thanh toán và chuyển trạng thái pha chế** để **phục vụ đúng thứ tự**. | FR-08 | Should | 2 | Chỉ tài khoản `STAFF` vào được KDS; chuyển `PAID → PREPARING → READY → COMPLETED`, chặn nhảy cóc; hủy đơn `PAID` thì hoàn kho, thu hồi điểm. | UT-T01, INT-T10, INT-T12, INT-T17, E2E-T02 |
| **US-09** | Là **khách hàng**, tôi muốn **nhập mã giảm giá và được cộng điểm thưởng** để **mua rẻ hơn và quay lại quán**. | FR-09 | Should | 2 | `BREW10`/`BREWNEW` tính đúng điều kiện; 10.000đ = 1 điểm sau khi `PAID`; số tiền giảm do backend tính. | UT-T03, UT-T07, API-T06, INT-T02, INT-T05, E2E-T01 |
| **US-10** | Là **khách hàng**, tôi muốn **xem lại lịch sử đơn đã đặt** để **đối chiếu chi tiêu**. | FR-10 | Must | 2 | Chỉ đơn của mình, mới nhất lên đầu. | INT-T11 |
| **US-11** | Là **khách hàng**, tôi muốn **hủy đơn khi thanh toán thất bại** để **đặt lại hoặc đổi món khác**. | FR-11 | Should | 2 | Hủy được đơn `PENDING`/`PAYMENT_FAILED` của mình, giỏ hàng giữ nguyên; đơn đã `PAID` không hủy được. | INT-T14, INT-T16 |
| **US-12** | Là **khách hàng**, tôi muốn **chọn mức đá và lượng đường** để **đồ uống hợp khẩu vị**. | FR-12 | Won't | – | Không làm trong Assignment 2. | – |

---

## 3. CÔNG VIỆC KỸ THUẬT ĐI KÈM (KHÔNG PHẢI USER STORY)

| Mã | Công việc | Sprint | Tạo phẩm |
| :---: | :--- | :---: | :--- |
| TECH-01 | Thiết lập repository (`apps/web`, `apps/api`, `docs`), branch strategy, Definition of Done | 1 | `README.md` |
| TECH-02 | Tài liệu Task 1–3 trong `docs/` | 1 | `docs/requirements`, `docs/diagrams`, `docs/architecture` |
| TECH-03 | CI: Install → Lint → Unit Test → Build cho mọi pull request | 1 | `.github/workflows/ci.yml` |
| TECH-04 | PostgreSQL + Prisma migration + seed, Docker Compose | 2 | `apps/api/prisma`, `docker-compose.yml` |
| TECH-05 | Integration test, E2E test | 2 | `tests/integration`, `tests/e2e` |
| TECH-06 | CD: image GHCR theo commit SHA, deploy Render/Vercel, smoke test, rollback | 2 | `.github/workflows/cd.yml`, `docs/deployment.md` |
