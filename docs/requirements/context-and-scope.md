# TÀI LIỆU BỐI CẢNH, STAKEHOLDERS VÀ PHẠM VI HỆ THỐNG
## DỰ ÁN: BREWLITE – CASHLESS COFFEE ORDERING SYSTEM
> **Mã tài liệu:** `REQ-DOC-01` | **Phiên bản:** VER 1.0  
> **Thuộc nhiệm vụ:** Task 1.1 – Khai thác và đặc tả yêu cầu (Assignment 2)  
> **Môn học:** Công nghệ Phần mềm — Khoa CNTT, Trường Đại học Sài Gòn (SGU)  

---

## 1. BỐI CẢNH VÀ VẤN ĐỀ NGHIỆP VỤ CẦN GIẢI QUYẾT

### 1.1. Thực trạng tại các cửa hàng đồ uống hiện nay
Trong mô hình kinh doanh quán cà phê truyền thống và take-away hiện nay, quy trình phục vụ tại quầy bộc lộ nhiều điểm nghẽn nghiêm trọng, đặc biệt vào các khung giờ cao điểm (8h00 - 9h30 sáng và 12h00 - 13h30 trưa):
- **Thời gian chờ đợi kéo dài:** Khách hàng phải xếp hàng dài để gọi món, chờ nhân viên thu ngân nhập liệu vào máy POS, kiểm đếm tiền mặt và trả tiền lẻ. Thời gian trung bình cho mỗi lượt giao dịch tiền mặt dao động từ 1.5 đến 3 phút.
- **Sai sót trong ghi nhận khẩu vị (Customization Errors):** Đồ uống hiện đại có rất nhiều tùy chọn cá nhân hóa (size S/M/L, lượng đá 0%/50%/100%, lượng đường, các loại topping phụ như trân châu, kem cheese). Việc trao đổi qua quầy dễ bị nhầm lẫn do tiếng ồn không gian quán, dẫn đến việc pha chế sai món, gây lãng phí nguyên liệu và làm khách hàng thất vọng.
- **Quá tải nhân sự và nguy cơ thất thoát:** Nhân viên thu ngân vừa phải tính tiền, vừa phải quản lý tiền lẻ, vừa điều phối đơn về quầy bar. Việc thanh toán tiền mặt tiềm ẩn rủi ro thất thoát doanh thu và khó kiểm soát đối soát ca.

### 1.2. Giải pháp BrewLite
**BrewLite** là giải pháp phần mềm Web App hỗ trợ **Đặt đồ uống và Thanh toán không dùng tiền mặt tại chỗ** (On-premise Mobile/Counter Ordering):
- Khách hàng chủ động quét mã / mở ứng dụng trên điện thoại, tự do duyệt thực đơn trực quan, tự chọn khẩu vị và topping chính xác theo ý muốn.
- Thanh toán tức thì qua các cổng thanh toán điện tử (Ví MoMo, VNPay, Thẻ ngân hàng) mà không cần dùng tiền mặt.
- Hệ thống tự sinh mã đơn hàng rút gọn (ví dụ: `#ORD-104271`) và hiển thị thanh tiến trình chế biến trực quan. Khách hàng chỉ việc ghé quầy nhận đồ uống khi màn hình báo sẵn sàng.

---

## 2. MA TRẬN CÁC BÊN LIÊN QUAN (STAKEHOLDER MATRIX)

Hệ thống BrewLite phục vụ và chịu sự tác động của **6 nhóm Stakeholder** chính:

| STT | Stakeholder | Vai trò & Trách nhiệm trong hệ thống | Mục tiêu & Kỳ vọng cốt lõi | Mức độ ảnh hưởng / Quan tâm |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Khách hàng (Customer)** | Người dùng cuối trực tiếp duyệt menu, tùy biến đồ uống, tạo đơn, thanh toán điện tử và nhận nước. | • Đặt món nhanh chóng dưới 1 phút.<br>• Menu hiển thị rõ giá, ảnh đẹp, chính xác tùy biến.<br>• Thanh toán an toàn, không bị trừ tiền lặp.<br>• Biết chính xác khi nào đồ uống pha xong. | **Rất cao / Rất cao** |
| **2** | **Nhân viên Quầy / Pha chế (Barista)** | Tiếp nhận đơn hàng đã thanh toán thành công, thực hiện pha chế và bàn giao tại quầy. | • Màn hình KDS hiển thị đơn rõ ràng, sắp xếp theo thứ tự thời gian.<br>• Đầy đủ chi tiết size, topping, độ ngọt/đá.<br>• Cập nhật trạng thái chế biến chỉ bằng 1 chạm. | **Rất cao / Cao** |
| **3** | **Quản lý cửa hàng (Store Manager / PO)** | Giám sát vận hành, quản trị danh mục sản phẩm, tồn kho và doanh thu. | • Giảm thiểu thời gian nghẽn tại quầy.<br>• Kiểm soát tồn kho chính xác, không bán vượt số lượng còn lại.<br>• Minh bạch dòng tiền giao dịch. | **Cao / Rất cao** |
| **4** | **Giảng viên / Khách hàng nghiệm thu (Auditor)** | Đánh giá tính đúng đắn của quy trình phần mềm, kiến trúc kỹ thuật và chất lượng bàn giao. | • Quy trình Agile Scrum tuân thủ nghiêm ngặt.<br>• Đầy đủ tài liệu, sơ đồ UML chuẩn hóa.<br>• Ma trận truy vết 100% từ yêu cầu đến test.<br>• Ứng dụng chạy thực tế trên môi trường Production. | **Rất cao / Rất cao** |
| **5** | **Nhóm phát triển (Dev Team)** | Phân tích yêu cầu, thiết kế kiến trúc, lập trình full-stack, viết automated tests và triển khai CI/CD. | • Kiến trúc module hóa sạch sẽ, dễ mở rộng.<br>• Pipeline CI/CD tự động phát hiện lỗi sớm.<br>• Đảm bảo tính toàn vẹn nghiệp vụ qua test. | **Cao / Rất cao** |
| **6** | **Đơn vị thanh toán (Payment Gateway Provider)** | Cung cấp hạ tầng xử lý giao dịch điện tử (mô phỏng qua Mock Payment Service MoMo/VNPay/Card). | • Giao dịch an toàn, toàn vẹn dữ liệu.<br>• Hỗ trợ cơ chế Idempotent chống trùng lặp request giao dịch. | **Trung bình / Cao** |

---

## 3. PHẠM VI HỆ THỐNG (SYSTEM SCOPE)

### 3.1. Phạm vi trong MVP (In-Scope — Đưa vào hiện thực)
Các tính năng cốt lõi bắt buộc phải hoàn thành và kiểm thử nghiêm ngặt:
1. **Duyệt Thực đơn (Menu Browsing):** Hiển thị danh mục món uống kèm giá niêm yết, hình ảnh, tag phân loại; bộ lọc category và tìm kiếm tức thì; xử lý skeleton loading, empty state.
2. **Tùy biến sản phẩm (Customization):** Lựa chọn kích cỡ Size S/M/L với phụ thu theo từng món, lựa chọn Topping kèm giá phụ thu. Tự động tính giá động trực tiếp trên giao diện; backend tự tính lại giá khi tạo đơn.
3. **Quản lý Giỏ hàng (Cart Management):** Lưu trữ giỏ hàng tại máy khách qua Zustand kết hợp LocalStorage; thêm/sửa số lượng/xóa món; hiển thị badge số lượng realtime trên thanh điều hướng.
4. **Xác thực và phân quyền (Authentication & Authorization):** Đăng ký, đăng nhập tài khoản khách hàng, băm mật khẩu Bcrypt, phát hành mã xác thực JWT, bảo vệ các API riêng tư bằng JWT Guard. Phân biệt vai trò `CUSTOMER` và `STAFF`; khách chỉ truy cập được đơn của chính mình.
5. **Khởi tạo Đơn hàng (Order Creation):** Tạo đơn hàng trạng thái mặc định `PENDING`, kiểm duyệt tính hợp lệ của DTO bằng Class-Validator.
6. **Thanh toán không tiền mặt (Cashless Payment):** Chọn cổng thanh toán mô phỏng (MoMo, VNPay, Thẻ ngân hàng), gửi kèm `Idempotency-Key` độc nhất chống thanh toán trùng; xử lý chuyển trạng thái `PAID` (thành công) hoặc `PAYMENT_FAILED` (thất bại cho phép thử lại hoặc hủy đơn).
7. **Theo dõi đơn & Lịch sử (Order Tracking & History):** Màn hình hiển thị mã đơn `#ORD-XXXXXX`, timeline tiến trình đơn tự cập nhật; tra cứu danh sách đơn đã đặt cá nhân; khách tự hủy đơn chưa thanh toán.
8. **Màn hình điều phối quầy Barista (KDS):** Giao diện Dark-mode, chỉ tài khoản `STAFF` truy cập được, cho nhân viên quầy tiếp nhận đơn `PAID` và cập nhật luân chuyển trạng thái: `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`.
9. **Nghiệp vụ Backend Chuyên sâu:** Order State Machine chặn trạng thái sai, Optimistic Locking chống bán vượt tồn kho (overselling), hệ thống mã giảm giá (Promotion) và tích lũy điểm Loyalty.
10. **Tự động hóa & Triển khai:** Docker Compose cho môi trường cục bộ; Pipeline CI/CD tự động; Triển khai live trên nền tảng Cloud có HTTPS và Health Check.

### 3.2. Phạm vi mở rộng (Extended Scope — có thể làm ở phiên bản sau)
Các tính năng phù hợp với sản phẩm và đã ghi vào Product Backlog, nhưng **không nằm trong phạm vi nghiệm thu của Assignment 2**:
- Chọn mức đá (0% / 50% / 100%) và lượng đường cho từng món.
- Đẩy trạng thái đơn theo thời gian thực bằng WebSocket cho màn hình KDS và khách hàng (MVP dùng tự tải lại định kỳ).
- Thanh toán VietQR động với webhook xác nhận tự động.
- Trang quản trị cho quản lý cửa hàng: thêm/sửa món, nhập tồn kho, tạo tài khoản barista, báo cáo doanh thu.
- Đổi điểm loyalty lấy ưu đãi.

### 3.3. Nội dung không thực hiện (Out-of-Scope)
Những nội dung nhóm **không làm** trong dự án này:
- Kết nối cổng thanh toán thật (MoMo, VNPay, ngân hàng): chỉ dùng dịch vụ thanh toán mô phỏng.
- Thanh toán tiền mặt (định hướng sản phẩm là cashless).
- Hoàn tiền tự động khi hủy đơn đã thanh toán.
- Giao hàng tận nhà (Delivery) kết nối tài xế ngoài (Shipper).
- Đặt bàn trước nhiều ngày (Table Reservation).
- Tích hợp thiết bị phần cứng máy pha cà phê thông minh qua IoT.
- Đa chi nhánh chuỗi cửa hàng (Multi-franchise management).

---

## 4. GIẢ ĐỊNH, RÀNG BUỘC VÀ QUẢN TRỊ RỦI RO

### 4.1. Giả định (Assumptions)
- Khách hàng sử dụng thiết bị di động thông minh hoặc máy tính có trình duyệt web hiện đại (Chrome, Safari, Edge, Firefox) và có kết nối Internet ổn định.
- Tại quầy pha chế có tối thiểu một thiết bị (máy tính bảng hoặc màn hình PC) để nhân viên Barista theo dõi màn hình Kitchen Display System.
- Cổng thanh toán bên thứ ba được mô phỏng trung thực (Mock Payment Gateway) bao gồm cả độ trễ mạng và các kịch bản thành công/thất bại để kiểm thử.

### 4.2. Ràng buộc kỹ thuật (Constraints)
- **Công nghệ bắt buộc của đề bài:** Frontend sử dụng **Next.js**; Backend sử dụng **NestJS**; Cơ sở dữ liệu sử dụng **PostgreSQL**; Đóng gói container bằng **Docker**. Nhóm có thể bổ sung thư viện hỗ trợ nhưng không được thay thế 4 thành phần này.
- **Thời gian phản hồi (Latency):** API phản hồi dưới 500ms đối với dữ liệu thử nghiệm.
- **Chi phí hạ tầng:** Ưu tiên triển khai trên các nền tảng đám mây có gói miễn phí/sinh viên (Vercel, Render, Railway, NeonDB) nhưng phải bảo đảm kết nối ổn định qua HTTPS.

### 4.3. Bảng Phân tích Rủi ro Ban đầu & Biện pháp Giảm thiểu

| Rủi ro kỹ thuật / Nghiệp vụ | Khả năng xảy ra | Mức độ nghiêm trọng | Biện pháp giảm thiểu trong thiết kế |
| :--- | :---: | :---: | :--- |
| **Khách hàng bấm thanh toán nhiều lần do mạng chập chờn** | Cao | Rất cao | Áp dụng cơ chế **Idempotency-Key (UUIDv4)**. Backend kiểm tra khóa giao dịch trước khi trừ tiền; nếu trùng lặp chỉ trả về kết quả cũ. |
| **Nhiều khách cùng đặt món giới hạn số lượng tại cùng 1 giây (Race Condition)** | Trung bình | Nghiêm trọng | Áp dụng **Khóa lạc quan (Optimistic Locking)** với trường `version` trong PostgreSQL kết hợp Database Transaction. Tự động rollback và báo lỗi `409 Conflict`. |
| **Trạng thái đơn hàng bị cập nhật sai luồng (ví dụ: nhảy cóc từ PENDING lên COMPLETED)** | Thấp | Nghiêm trọng | Thiết lập **Finite State Machine** bất biến với hàm chặn `assertTransition()`, ném `BadRequestException (400)` nếu vi phạm. |
| **Mất giỏ hàng khi người dùng tải lại trang web** | Cao | Trung bình | Sử dụng **Zustand kết hợp LocalStorage persist engine** lưu trữ trạng thái giỏ hàng ngay tại trình duyệt client. |
| **Dịch vụ Cloud miễn phí bị sleep (Cold Start)** | Cao | Trung bình | Thiết lập endpoint `GET /api/health` và cấu hình ping định kỳ hoặc smoke test kiểm tra liveness của server. |

---
*Tài liệu được thiết lập làm căn cứ xác định phạm vi nghiệm thu cho toàn bộ các Task tiếp theo của Assignment 2.*
