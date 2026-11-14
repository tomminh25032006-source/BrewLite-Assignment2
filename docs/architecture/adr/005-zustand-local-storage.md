# ADR 005: Quản lý Trạng thái Giỏ hàng Client bằng Zustand kết hợp LocalStorage Persistence
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-17  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Trải nghiệm chọn món cà phê tại quán đòi hỏi sự mượt mà tối đa:
- Người dùng có thể duyệt nhiều món, thêm vào giỏ, điều chỉnh số lượng hoặc kích cỡ.
- Nếu lưu giỏ hàng trong cơ sở dữ liệu server qua API mỗi lần bấm "Thêm vào giỏ", server sẽ phải chịu tải lớn không cần thiết cho những giỏ hàng tạm thời. Hơn nữa, nếu người dùng chưa đăng nhập thì việc gắn giỏ hàng với Session ID sẽ làm phức tạp hóa kiến trúc.
- Nếu chỉ lưu trong React Context thông thường, khi người dùng vô tình tải lại trang (F5) hoặc chuyển hướng trang, toàn bộ giỏ hàng sẽ bị biến mất, gây ức chế cho người dùng.

## 2. Quyết định (Decision)
Lựa chọn thư viện **Zustand** kết hợp middleware **`persist` (lưu vào `localStorage`)** để quản lý trạng thái giỏ hàng (`cartStore.ts`) và phiên đăng nhập (`authStore.ts`):
- Dung lượng thư viện siêu nhỏ ($< 1.5\text{KB}$ so với hơn $15\text{KB}$ của Redux Toolkit).
- Không cần cấu hình Boilerplate phức tạp (không cần reducers, actions, action-types).
- Cơ chế Selector thông minh, chỉ re-render component khi dữ liệu đăng ký thực sự thay đổi.
- Dữ liệu giỏ hàng tự động được lưu trữ bền vững tại trình duyệt qua khóa `brewlite-cart-storage`.

## 3. Hệ quả (Consequences)
- **Tích cực:** 
  - Khách hàng tải lại trang hoặc tắt tab mở lại vẫn giữ nguyên giỏ hàng cà phê đã chọn.
  - Tốc độ tương tác tức thì (0ms latency), không phụ thuộc vào kết nối mạng khi sửa giỏ hàng.
  - Huy hiệu (Badge) số lượng cốc cà phê trên thanh điều hướng Navbar luôn đồng bộ mượt mà.
- **Tiêu cực:** Giỏ hàng chỉ lưu trên một thiết bị trình duyệt cụ thể, không tự đồng bộ nếu khách đổi từ điện thoại sang máy tính. Nhóm chấp nhận hạn chế này vì bối cảnh sử dụng là khách đặt món và thanh toán ngay trên chính điện thoại của mình tại quán.
