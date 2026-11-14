# MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX)
## DỰ ÁN: BREWLITE – CASHLESS COFFEE ORDERING SYSTEM
> **Mã tài liệu:** `TRC-DOC-01` | **Phiên bản:** VER 1.2
> **Thuộc nhiệm vụ:** Mục 8 – Truy vết bắt buộc (Assignment 2)
> **Nguồn yêu cầu:** [`requirements/srs.md`](./requirements/srs.md), [`requirements/user-stories.md`](./requirements/user-stories.md), [`requirements/use-case-checkout.md`](./requirements/use-case-checkout.md)

---

## 1. QUY ƯỚC MÃ

| Loại | Mã | Vị trí |
| :--- | :--- | :--- |
| Use-case | `UC-01` (Đặt và thanh toán đơn hàng — use-case trọng tâm) … `UC-10` | `requirements/srs.md` §1, `requirements/use-case-checkout.md` |
| User Story | `US-01` … `US-12` (mỗi `US-xx` ứng với `FR-xx` cùng số) | `requirements/user-stories.md` |
| Sơ đồ | `UseCase-00` = `diagrams/use-case-overview.puml`<br>`UseCase-01` = `diagrams/use-case-checkout.puml`<br>`Activity-01` = `diagrams/activity-checkout.puml`<br>`Sequence-01` = `diagrams/sequence-checkout.puml`<br>`Class-<Tên lớp>` = `diagrams/class-domain.puml`<br>`Deploy-01` = `diagrams/deployment-diagram.puml` | `docs/diagrams/` (mỗi sơ đồ có `.puml` và `.svg`) |
| Quyết định kiến trúc | `ADR-001` … `ADR-008` | `docs/architecture/adr/` |
| Unit test backend | `UT-T01` … `UT-T07` | `apps/api/src/**/*.spec.ts` |
| Unit/component test frontend | `FE-T01`, `FE-T02` | `apps/web/src/__tests__/` |
| Integration test API (HTTP + PostgreSQL) | `API-T00` … `API-T06`, `INT-T01` … `INT-T17` | `tests/integration/` |
| End-to-end test (Playwright) | `E2E-T01`, `E2E-T02` | `tests/e2e/checkout.spec.ts` |

---

## 2. TRUY VẾT YÊU CẦU CHỨC NĂNG

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
| :---: | :--- | :--- | :--- | :--- |
| **FR-01** | US-01 Xem menu (UC-02) | UseCase-00, Activity-01, Class-Product | `GET /api/products`<br>`apps/api/src/modules/products/products.service.ts`<br>`apps/web/src/app/menu/page.tsx` | API-T01, UT-T04, FE-T01, E2E-T01 |
| **FR-02** | US-02 Tùy biến size, topping và tính giá (UC-03) | Activity-01, Class-Product, Class-OrderItem | `GET /api/products/:id`<br>`apps/web/src/components/ProductModal.tsx`<br>`apps/web/src/stores/cartStore.ts`<br>`apps/api/src/modules/orders/order-pricing.ts` | API-T02, UT-T02, FE-T02, INT-T02 |
| **FR-03** | US-03 Giỏ hàng và tổng tiền (UC-04) | Activity-01, ADR-005 | `apps/web/src/stores/cartStore.ts`<br>`apps/web/src/app/cart/page.tsx` | FE-T02, E2E-T01 |
| **FR-04** | US-04 Đăng ký, đăng nhập JWT (UC-05) | Sequence-01 (đăng nhập), Class-User, ADR-008 | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`GET /api/auth/me`<br>`apps/api/src/modules/auth/` | API-T03, API-T04, INT-T01 |
| **FR-05** | UC-01 Đặt đơn (PENDING) / US-05 | UseCase-01, Sequence-01 (giai đoạn 1), Activity-01 (nhánh hết hàng), Class-Order, Class-OrderItem, Class-Promotion | `POST /api/orders`<br>`apps/api/src/modules/orders/orders.service.ts` | UT-T05, INT-T02, INT-T03, INT-T04 |
| **FR-06** | UC-01 Thanh toán Ví/Thẻ idempotent / US-06 | UseCase-01, Sequence-01 (giai đoạn 2), Activity-01 (thanh toán thất bại), ADR-003, ADR-004, Class-Payment | `POST /api/payments`<br>`apps/api/src/modules/payments/payments.service.ts`<br>`apps/web/src/app/checkout/page.tsx` | UT-T06, INT-T05, INT-T06, INT-T07, INT-T08, INT-T13, INT-T14, INT-T15, E2E-T01 |
| **FR-07** | UC-01 Xác nhận đơn, UC-07 Theo dõi đơn / US-07 | Activity-01, Sequence-01 (thông báo kết quả), Class-Order | `GET /api/orders/:id`<br>`apps/web/src/app/orders/[id]/page.tsx` | INT-T05, INT-T14, E2E-T01, E2E-T02 |
| **FR-08** | US-08 Barista quản lý trạng thái đơn (UC-10) | Activity-01 (swimlane Barista), ADR-002, ADR-008, Class-Order (OrderStatus), Class-User (Role) | `GET /api/orders`<br>`PATCH /api/orders/:id/status`<br>`apps/api/src/modules/orders/order-state-machine.ts`<br>`apps/api/src/modules/auth/roles.guard.ts` (`@Roles(STAFF)`)<br>`OrdersService.updateOrderStatus` (hủy đơn `PAID` → hoàn kho, thu hồi điểm)<br>`apps/web/src/app/staff/page.tsx` | UT-T01, INT-T10, INT-T12, INT-T17, E2E-T02 |
| **FR-09** | US-09 Khuyến mãi và tích điểm (UC-06) | Class-Promotion, Class-LoyaltyTransaction, Sequence-01 | `GET /api/promotions/:code`<br>`apps/api/src/modules/promotions/promotions.service.ts`<br>`apps/api/src/modules/orders/order-pricing.ts` (`calculateDiscount`)<br>`apps/web/src/app/cart/page.tsx`<br>`apps/api/src/modules/payments/payments.service.ts` (LoyaltyTransaction) | UT-T03, UT-T05, UT-T07, API-T06, INT-T02, INT-T05, E2E-T01 |
| **FR-10** | US-10 Lịch sử đơn (UC-08) | Class-Order, Class-User | `GET /api/orders/me`<br>`apps/web/src/app/orders/page.tsx` | INT-T11 |
| **FR-11** | US-11 Hủy đơn chưa thanh toán (UC-09) | UseCase-01 (`<<extend>>`), Activity-01 (nhánh hủy đơn), ADR-002 | `POST /api/orders/:id/cancel`<br>`OrdersService.cancelByCustomer`<br>`apps/web/src/app/checkout/page.tsx` (nút "Hủy đơn") | INT-T14, INT-T16 |
| FR-12, FR-13 | US-12 (Won't) | – | Không hiện thực trong Assignment 2 (`context-and-scope.md` §3.2, §3.3) | – |

---

## 3. TRUY VẾT YÊU CẦU PHI CHỨC NĂNG

| Mã yêu cầu | Đặc tính | Thiết kế/Sơ đồ | Code/Cấu hình | Test |
| :---: | :--- | :--- | :--- | :--- |
| **NFR-01** | Hiệu năng: API < 500ms | Architecture overview §2.3 | Prisma truy vấn có index (`@id`, `@unique`) | API-T01 (đo thời gian phản hồi) |
| **NFR-02** | Bảo mật: bcrypt, JWT, phân quyền, validate DTO | Sequence-01 (JwtAuthGuard, ValidationPipe, kiểm tra chủ đơn), ADR-008 | `apps/api/src/app.setup.ts` (`whitelist`, `forbidNonWhitelisted`)<br>`apps/api/src/modules/auth/` (bcrypt, `JWT_SECRET` từ env, `RolesGuard`)<br>`OrdersService.findOwnedBy` (chỉ chủ đơn) | API-T04, INT-T01, INT-T03, INT-T12, INT-T14 |
| **NFR-03** | Khả dụng: mobile-first / PWA | Deploy-01 (Trình duyệt/PWA) | `apps/web/public/manifest.json`, `apps/web/src/app/layout.tsx` (viewport, manifest) | FE-T01, E2E-T01, E2E-T02 (chạy trên thiết bị giả lập Pixel 7) |
| **NFR-04** | Toàn vẹn dữ liệu và đồng thời | Sequence-01 (BEGIN/COMMIT/ROLLBACK), ADR-003, ADR-004 | `prisma.$transaction` và `claimOrder` trong `payments.service.ts`<br>`deductStockWithOptimisticLock` trong `products.service.ts` | UT-T04, UT-T06, INT-T08, INT-T09, INT-T13 |
| **NFR-05** | Khả năng triển khai | Deploy-01, ADR-006, ADR-007 | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `apps/api/prisma/migrations/` | Pipeline CI (job `e2e` chạy E2E-T01, E2E-T02 trên docker compose), API-T00, API-T05, CD smoke test (đúng commit SHA) |

---

## 4. DANH MỤC TEST

| Mã test | Mô tả | Tệp |
| :--- | :--- | :--- |
| UT-T01 | State machine chặn chuyển trạng thái sai, cho phép thanh toán lỗi nhiều lần | `apps/api/src/modules/orders/order-state-machine.spec.ts` |
| UT-T02 | Đơn giá = giá gốc + size + topping, từ chối topping/size lạ | `apps/api/src/modules/orders/order-pricing.spec.ts` |
| UT-T03 | Tính giảm giá BREW10 / BREWNEW và điều kiện đơn tối thiểu | `apps/api/src/modules/orders/order-pricing.spec.ts` |
| UT-T04 | ProductsService: lọc menu, 404, trừ kho optimistic locking có thử lại | `apps/api/src/modules/products/products.service.spec.ts` |
| UT-T05 | OrdersService.createOrder: giá backend, khuyến mãi, 409 hết hàng | `apps/api/src/modules/orders/orders.service.spec.ts` |
| UT-T06 | PaymentsService: thiếu key, replay idempotent, đơn đã PAID, key của đơn khác, đơn bị giao dịch khác giành | `apps/api/src/modules/payments/payments.service.spec.ts` |
| UT-T07 | PromotionsService: chuẩn hóa mã, tính số tiền giảm, từ chối mã sai/tắt/hết hạn, chưa đủ giá trị tối thiểu | `apps/api/src/modules/promotions/promotions.service.spec.ts` |
| FE-T01 | Màn hình menu: loading, empty, error + thử lại, lọc danh mục | `apps/web/src/__tests__/menu-page.test.tsx` |
| FE-T02 | Giỏ hàng: đơn giá theo `sizeOptions` của món, gộp món, tổng tiền, localStorage | `apps/web/src/__tests__/cart-store.test.ts` |
| API-T00 | `GET /api/health` kiểm tra kết nối DB | `tests/integration/api.int-spec.ts` |
| API-T01 | `GET /api/products` từ PostgreSQL, lọc category, < 500ms | `tests/integration/api.int-spec.ts` |
| API-T02 | `GET /api/products/:id`, 404 | `tests/integration/api.int-spec.ts` |
| API-T03 | Đăng ký, đăng nhập, `GET /api/auth/me` | `tests/integration/api.int-spec.ts` |
| API-T04 | Validate đăng ký, sai mật khẩu, token giả | `tests/integration/api.int-spec.ts` |
| API-T05 | `GET /api/health` trả commit SHA của bản đang chạy (CD dùng để xác nhận deploy) | `tests/integration/api.int-spec.ts` |
| API-T06 | `GET /api/promotions/:code` tính số tiền giảm ở backend; mã sai, chưa đủ điều kiện, thiếu/sai `subtotal` trả 400 | `tests/integration/api.int-spec.ts` |
| INT-T01 | `POST /api/orders` không JWT → 401 | `tests/integration/orders-payments.int-spec.ts` |
| INT-T02 | Tạo đơn PENDING, giá topping do backend tính, mã giảm giá | `tests/integration/orders-payments.int-spec.ts` |
| INT-T03 | Validate đơn: giỏ trống, size sai, topping lạ, field lạ | `tests/integration/orders-payments.int-spec.ts` |
| INT-T04 | Đặt vượt tồn kho → 409 | `tests/integration/orders-payments.int-spec.ts` |
| INT-T05 | Thanh toán thành công: PAID, trừ kho, cộng điểm, LoyaltyTransaction | `tests/integration/orders-payments.int-spec.ts` |
| INT-T06 | Cùng Idempotency-Key chỉ tạo 1 giao dịch | `tests/integration/orders-payments.int-spec.ts` |
| INT-T07 | Thanh toán lỗi 2 lần rồi thử lại thành công | `tests/integration/orders-payments.int-spec.ts` |
| INT-T08 | Lỗi giữa chừng → rollback toàn bộ transaction | `tests/integration/orders-payments.int-spec.ts` |
| INT-T09 | 5 khách thanh toán đồng thời, kho 2 → đúng 2 đơn PAID | `tests/integration/orders-payments.int-spec.ts` |
| INT-T10 | Nhân viên quầy (`STAFF`) xem toàn bộ đơn, chuyển trạng thái theo state machine | `tests/integration/orders-payments.int-spec.ts` |
| INT-T11 | Lịch sử đơn của khách | `tests/integration/orders-payments.int-spec.ts` |
| INT-T12 | Chỉ `STAFF` xem đơn cả quán, đổi trạng thái; không ai đặt `PAID` bằng tay | `tests/integration/orders-payments.int-spec.ts` |
| INT-T13 | Nhiều request thanh toán cùng một đơn (khác key) chỉ 1 lần thành công, trừ kho 1 lần | `tests/integration/orders-payments.int-spec.ts` |
| INT-T14 | Khách khác không xem, không thanh toán, không hủy được đơn | `tests/integration/orders-payments.int-spec.ts` |
| INT-T15 | `Idempotency-Key` của đơn khác bị từ chối (409) | `tests/integration/orders-payments.int-spec.ts` |
| INT-T16 | Khách hủy đơn chưa thanh toán; đơn đã thanh toán không hủy được | `tests/integration/orders-payments.int-spec.ts` |
| INT-T17 | Nhân viên hủy đơn đã `PAID`: hoàn tồn kho, thu hồi điểm (`LoyaltyTransaction` âm); hủy đơn `PENDING` không cộng kho | `tests/integration/orders-payments.int-spec.ts` |
| E2E-T01 | Menu → tùy chọn → giỏ (áp mã giảm giá qua API) → đăng nhập → thanh toán → xác nhận đơn | `tests/e2e/checkout.spec.ts` |
| E2E-T02 | Nhân viên quầy đăng nhập KDS (`/staff`) nhận đơn, trang theo dõi đơn của khách tự cập nhật | `tests/e2e/checkout.spec.ts` |
