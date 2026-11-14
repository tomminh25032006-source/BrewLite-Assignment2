# ADR 008: Phân quyền theo Vai trò (Customer / Barista) và Kiểm tra Chủ đơn
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-27  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Khi rà soát bảo mật trước khi bàn giao, nhóm gửi request thử trực tiếp lên API và tái hiện được các lỗi sau:
- `PATCH /api/orders/:id/status` không yêu cầu đăng nhập. Ma trận trạng thái (ADR-002) lại cho phép `PENDING → PAID`, nên ai cũng có thể chuyển đơn sang `PAID` mà không thanh toán, hoặc hủy đơn của người khác.
- Mọi tài khoản đều xem được toàn bộ đơn của quán (`GET /api/orders`) vì hệ thống chưa phân biệt khách hàng và barista.
- `GET /api/orders/:id` và `POST /api/payments` không kiểm tra chủ đơn. Mã đơn `ORD-xxxxxx` chỉ có 6 chữ số nên dễ đoán.

## 2. Quyết định (Decision)
- Thêm `enum Role { CUSTOMER, STAFF }` và trường `User.role` (mặc định `CUSTOMER`, migration `add_user_role`; giá trị ban đầu tên `BARISTA`, đổi thành `STAFF` ở migration `rename_barista_role_to_staff` cho thống nhất với Assignment 1, dữ liệu giữ nguyên). Seed tạo tài khoản `barista@brewlite.vn`. Đăng ký qua API luôn tạo tài khoản `CUSTOMER`.
- JWT mang thêm `role`. `RolesGuard` cùng decorator `@Roles(Role.STAFF)` chặn endpoint theo vai trò:
  - `GET /api/orders` (danh sách đơn của cả quán): chỉ `STAFF`;
  - `PATCH /api/orders/:id/status`: chỉ `STAFF`, và chỉ nhận `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
- **Kiểm tra chủ đơn** (`OrdersService.findOwnedBy`): khách chỉ xem, thanh toán, hủy được đơn của chính mình. Đơn của người khác trả `404`, như không tồn tại, để không lộ việc mã đơn đó có thật. Barista xem được mọi đơn.
- Trang `/staff` yêu cầu đăng nhập tài khoản `STAFF`; trang theo dõi đơn của khách không còn nút giả lập thao tác barista.

Các phương án không chọn:
- **API key riêng cho màn hình KDS:** phải phân phối và xoay vòng key thủ công, không biết nhân viên nào thao tác.
- **Ứng dụng quản trị tách riêng:** vượt phạm vi MVP.

## 3. Hệ quả (Consequences)
- **Tích cực:**
  - Đóng các lỗ hổng trên; có integration test chứng minh: INT-T12 (phân quyền), INT-T14 (chủ đơn), INT-T10 (nhân viên quầy vẫn làm việc bình thường), cùng E2E-T02.
  - Đáp ứng NFR-02 (bảo mật) và FR-08 (state machine không bị đi tắt từ bên ngoài).
- **Tiêu cực:**
  - Vai trò nằm trong JWT (hạn 7 ngày): đổi vai trò của một tài khoản chỉ có hiệu lực sau khi người đó đăng nhập lại. Token cũ không có `role` được coi là `CUSTOMER`.
  - Chưa có giao diện quản trị để tạo thêm tài khoản barista; hiện tạo bằng seed hoặc cập nhật trực tiếp trong database.
