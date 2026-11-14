# ADR 003: Kiểm soát Tồn kho Đồng thời bằng Khóa lạc quan (Optimistic Locking)
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-18  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Trong các đợt flash-sale hoặc khi một loại cà phê đặc biệt chỉ còn lại số lượng tồn kho rất ít (ví dụ: `stock = 1`), có thể xảy ra trường hợp hai hoặc nhiều khách hàng cùng bấm "Xác nhận Thanh toán" tại cùng một tích tắc (Race Condition).
- Nếu đọc dữ liệu đồng thời không có khóa, cả 2 bên đều đọc được `stock = 1`, hệ thống trừ kho 2 lần $\rightarrow$ Tồn kho bị âm (`stock = -1`), gây ra tình trạng **bán vượt tồn kho (Overselling)** và không thể phục vụ khách hàng.

## 2. Quyết định (Decision)
Áp dụng **Khóa lạc quan (Optimistic Concurrency Control)** kết hợp trường `version: Int` trong bảng `Product`:
- Khi cập nhật trừ tồn kho, câu lệnh thực thi có kiểm tra điều kiện phiên bản:
  ```sql
  UPDATE "Product"
  SET "stock" = "stock" - :qty, "version" = "version" + 1
  WHERE "id" = :productId AND "version" = :expectedVersion AND "stock" >= :qty;
  ```
- Nếu số bản ghi bị ảnh hưởng bằng `0`, chứng tỏ đã có giao dịch khác can thiệp trước đó hoặc kho không còn đủ $\rightarrow$ Backend lập tức Rollback và ném lỗi `ConflictException (409)` hoặc `BadRequestException (400)`.
- Nhóm không chọn Khóa bi quan (`SELECT ... FOR UPDATE`) vì khóa bi quan gây lock dòng trong CSDL, làm giảm thông lượng (Throughput) khi số lượng người xem menu cùng lúc tăng cao.

## 3. Hệ quả (Consequences)
- **Tích cực:** 
  - Đảm bảo tính toàn vẹn dữ liệu tuyệt đối, không bao giờ có chuyện kho bị âm.
  - Hiệu năng hệ thống tối đa, không phát sinh Deadlock trong database.
  - Có test case chứng minh gửi đồng thời 5-10 request qua `Promise.all` chỉ chấp nhận đúng số lượng tồn ban đầu.
- **Tiêu cực:** Khách hàng đến sau sẽ nhận thông báo lỗi xung đột phiên bản và phải thao tác lại nếu muốn mua món khác.
