# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE SPECIFICATION)
## DỰ ÁN: BREWLITE – CASHLESS COFFEE ORDERING SYSTEM
> **Mã tài liệu:** `ARCH-DOC-01` | **Phiên bản:** VER 1.0  
> **Thuộc nhiệm vụ:** Task 3.1 – Phương pháp và quyết định kiến trúc (Assignment 2)  
> **Môn học:** Công nghệ Phần mềm — Khoa CNTT, Trường Đại học Sài Gòn (SGU)  

---

## 1. PHƯƠNG PHÁP THIẾT KẾ KIẾN TRÚC

Kiến trúc phần mềm của **BrewLite** được thiết kế dựa trên sự kết hợp hài hòa giữa **Mô hình C4 (Context, Container, Component)** và **Kiến trúc Đa tầng (Layered & Modular Architecture)**. Cách tiếp cận này giúp phân tách rõ ràng trách nhiệm giữa giao diện máy khách, tầng nghiệp vụ điều phối và tầng lưu trữ bền vững.

### 1.1. Sơ đồ Ngữ cảnh Hệ thống (C1 - System Context)

```mermaid
graph TB
    Customer[Khách hàng Coffee\n(Mobile Browser / PWA)]
    Barista[Nhân viên Barista\n(Tablet KDS / Web App)]
    
    BrewLiteSystem[Hệ thống BrewLite Cashless Coffee\n(Next.js + NestJS + PostgreSQL)]
    
    PaymentGateway[Cổng Thanh toán Đối tác\n(Mock MoMo / VNPay / Bank Card)]

    Customer -- "Duyệt thực đơn, chọn size/topping,\nđặt món và thanh toán không tiền mặt" --> BrewLiteSystem
    Barista -- "Xem đơn cần pha chế,\ncập nhật trạng thái READY / COMPLETED" --> BrewLiteSystem
    BrewLiteSystem -- "Gửi yêu cầu trừ tiền điện tử\nkèm Idempotency-Key" --> PaymentGateway
```

---

## 2. KIẾN TRÚC THÀNH PHẦN CHI TIẾT (CONTAINER & TIERS)

```mermaid
graph TB
    subgraph Client_Tier [TẦNG CLIENT: Next.js 14 App Router]
        WebPage[Mobile-First Pages:\n/, /menu, /cart, /checkout, /orders, /orders/:id, /staff]
        UIComp[UI Components:\nNavbar, ProductModal, ProductCard, AuthModal]
        ZustandStore[Zustand Persistent Stores:\ncartStore, authStore (LocalStorage)]
        ApiClient[API Client services/api.ts:\nfetch + header Bearer JWT]
    end

    subgraph API_Tier [TẦNG BACKEND: NestJS 10 Enterprise Framework]
        Router[Global Prefix: /api]
        GlobalPipes[ValidationPipe & DTO Sanitization]
        JwtGuard[JwtAuthGuard + RolesGuard:\nPassport JWT, vai trò CUSTOMER / STAFF]
        
        subgraph NestJS_Modules [Modules Nghiệp Vụ Tách Biệt]
            AuthModule[AuthModule:\nBcrypt, JWT Sign/Verify]
            ProductsModule[ProductsModule:\nMenu Catalog, Stock Lock Engine]
            OrdersModule[OrdersModule:\nOrder FSM, State Machine Assertion]
            PaymentsModule[PaymentsModule:\nIdempotency Checker, Mock MoMo]
            PromotionsModule[PromotionsModule:\nKiểm tra mã, tính số tiền giảm]
            HealthModule[AppController:\nGET /api/health - SELECT 1, commit SHA]
        end
    end

    subgraph Data_Tier [TẦNG DỮ LIỆU & PERSISTENCE]
        PrismaClient[Prisma ORM Client]
        Postgres[(PostgreSQL 16 Database:\nACID Transactions, Persistent Volume)]
    end

    WebPage --> UIComp
    UIComp --> ZustandStore
    UIComp --> ApiClient
    ApiClient -- "HTTPS / JSON REST" --> Router
    Router --> GlobalPipes
    GlobalPipes --> JwtGuard
    JwtGuard --> NestJS_Modules
    NestJS_Modules --> PrismaClient
    PrismaClient <--> Postgres
```

### 2.1. Tầng Client (Frontend Next.js)
- **App Router:** `layout.tsx` là Server Component khai báo metadata, viewport và manifest PWA. Các trang (`/menu`, `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/staff`) là Client Component vì cần trạng thái phía trình duyệt (giỏ hàng, token đăng nhập) và gọi API trực tiếp từ trình duyệt qua `src/services/api.ts`.
- **Thiết kế Mobile-First:** Ưu tiên hiển thị tối ưu trên thiết bị di động (chiếm 85% hành vi gọi món tại quầy).
- **Zustand State Engine:** Độc lập, không bị re-render thừa như Context API, tích hợp middleware `persist` lưu trạng thái giỏ hàng vào `localStorage` giúp khách hàng không bao giờ bị mất giỏ hàng khi lỡ tay tải lại trang.

### 2.2. Tầng Backend API (NestJS Modular Core)
- **Cấu trúc Module hóa theo Domain:** Mỗi nghiệp vụ (`auth`, `products`, `orders`, `payments`, `promotions`) cùng `PrismaModule` dùng chung đóng gói độc lập trong một Module gồm: `Controller` $\rightarrow$ `Service` $\rightarrow$ `DTO`.
- **Validation Pipeline:** Mọi dữ liệu đầu vào đều đi qua `ValidationPipe` toàn cục với `whitelist: true, forbidNonWhitelisted: true`, triệt tiêu nguy cơ Mass Assignment và SQL/NoSQL Injection.
- **Xác thực phi trạng thái (Stateless Authentication):** Sử dụng JSON Web Token (JWT) mang thông tin `userId`, mã hóa bằng khóa bí mật `JWT_SECRET`, thời hạn hết hạn 7 ngày.
- **Phân quyền (ADR-008):** JWT mang `role` (`CUSTOMER` hoặc `STAFF`). `RolesGuard` giới hạn danh sách đơn của quán và việc đổi trạng thái pha chế cho `STAFF`. `OrdersService.findOwnedBy` bảo đảm khách chỉ xem, thanh toán, hủy được đơn của chính mình.

### 2.3. Tầng Dữ liệu & Persistence (PostgreSQL & Prisma)
- **Chuẩn ACID & Ràng buộc toàn vẹn:** Khóa chính cuid, chỉ mục duy nhất `unique index` cho email, `orderCode` và `idempotencyKey`.
- **Quản lý khóa lạc quan (Optimistic Concurrency Control):** Trường số nguyên `version Int @default(0)` trên bảng `Product` đảm bảo hai giao dịch đồng thời không bao giờ làm âm kho.
- **Transaction:** Bước thanh toán (trừ kho, đổi trạng thái đơn, cộng điểm, ghi `LoyaltyTransaction` và `Payment`) chạy trong một `prisma.$transaction`; lỗi ở bất kỳ bước nào sẽ rollback toàn bộ.
- **Cơ chế Migration:** Schema khai báo tại `apps/api/prisma/schema.prisma`; migration sinh bằng `prisma migrate dev` và commit tại `apps/api/prisma/migrations/`. Ở Docker/production, container chạy `prisma migrate deploy` trước khi khởi động (chỉ áp dụng migration đã commit, không reset dữ liệu), sau đó chạy seed idempotent `dist-seed/seed.js`.

### 2.4. Logging, Health Check & Cấu hình môi trường
- Quản lý tập trung biến môi trường qua `@nestjs/config` và file `.env`.
- Endpoint giám sát sức khỏe `GET /api/health` chạy `SELECT 1` tới PostgreSQL và trả `{ status, database, service, version, commit, timestamp }` (`commit` = SHA của image, dùng để pipeline CD xác nhận bản mới đã chạy); DB lỗi trả `503`. Endpoint này được dùng cho `HEALTHCHECK` của Docker, health check của Render và bước smoke test trong CD.
- `JWT_SECRET` bắt buộc lấy từ biến môi trường (thiếu thì API dừng khởi động), không có giá trị mặc định trong mã nguồn.
- Log ứng dụng ghi ra stdout (NestJS Logger), được Render thu thập tại mục Logs.

---

## 3. PHÂN TÍCH ƯU ĐIỂM, HẠN CHẾ VÀ ĐÁNH ĐỔI (TRADE-OFFS)

| Quyết định Kiến trúc | Ưu điểm (Pros) | Hạn chế & Rủi ro (Cons) | Giải pháp Đánh đổi (Trade-off Justification) |
| :--- | :--- | :--- | :--- |
| **Monorepo cho cả Frontend & Backend** | • Dễ đồng bộ mã nguồn, dùng chung kiểu dữ liệu TypeScript.<br>• Một lệnh `docker-compose up` chạy được toàn bộ hệ thống.<br>• Quản lý commit lịch sử tập trung theo yêu cầu tuần tự của bài toán. | Kích thước repo tăng, cấu hình CI phức tạp hơn multi-repo. | Chấp nhận cấu hình CI phân nhánh để đảm bảo tiêu chí kiểm tra tuần tự và dễ nộp bài cho Giảng viên. |
| **Khóa lạc quan (Optimistic Locking) thay vì Khóa bi quan (Pessimistic Locking)** | • Không khóa cứng hàng (table lock / row lock) trong DB.<br>• Tốc độ đọc menu và xử lý đồng thời cực cao.<br>• Tránh hiện tượng Deadlock hệ thống. | Nếu tỷ lệ tranh chấp mua hàng quá dày đặc, một số request sẽ nhận lỗi 409 Conflict. | Với bài toán quán cà phê (tồn kho từng món từ vài chục đến hàng trăm), xung đột tức thời là rất hiếm. Khóa lạc quan là lựa chọn tối ưu hiệu năng vượt trội. |
| **Thanh toán Idempotent qua Header UUIDv4** | • Ngăn chặn triệt để việc khách bấm 2 lần trừ tiền 2 lần.<br>• Không cần duy trì session phức tạp phía server. | Phải lưu trữ và duy trì bảng index `idempotencyKey` trong CSDL. | Hoàn toàn xứng đáng vì bảo vệ 100% tính toàn vẹn tài chính cho khách hàng và cửa hàng. |
| **Lưu giỏ hàng phía Client (Zustand LocalStorage)** | • Tốc độ phản hồi tức thì (0ms latency).<br>• Giảm tải tối đa cho server database.<br>• Khách chưa đăng nhập vẫn nhặt đồ uống vào giỏ được. | Không đồng bộ giỏ hàng chéo nếu khách đổi sang thiết bị khác trước khi thanh toán. | Đây là nghiệp vụ mua cà phê tại quầy (khách đặt trên 1 máy rồi thanh toán ngay), việc đồng bộ đa thiết bị là không cần thiết trong giai đoạn MVP. |

---
*Tài liệu kiến trúc này là khung xương kỹ thuật kết nối trực tiếp với các bản ghi quyết định kiến trúc (ADRs) trong thư mục `docs/architecture/adr/`.*
