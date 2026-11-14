# ADR 006: Nền tảng Triển khai Production – Vercel + Render + GHCR
> **Trạng thái:** Được chấp thuận (Accepted)  
> **Ngày quyết định:** 2026-10-27  
> **Người quyết định:** Nhóm phát triển BrewLite  

---

## 1. Bối cảnh (Context)
Assignment 2 (Task 5.3, 5.4) yêu cầu:
- frontend production truy cập được qua HTTPS;
- API và health check có URL công khai;
- database production không public trực tiếp;
- pipeline đóng gói Docker image, đẩy lên container registry, deploy bằng secret của CI, có smoke test và rollback.

Nhóm là sinh viên nên ưu tiên các nền tảng có gói miễn phí, tự cấp HTTPS và cấu hình ít.

Các phương án đã cân nhắc:

| Phương án | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| VPS tự quản (Docker Compose + Nginx) | Toàn quyền cấu hình | Tự lo HTTPS, bảo mật máy chủ, sao lưu; tốn chi phí |
| AWS / Azure | Đầy đủ dịch vụ | Cấu hình phức tạp, dễ phát sinh chi phí |
| Railway / Fly.io | Deploy Docker đơn giản | Gói miễn phí hạn chế, nhóm chưa có kinh nghiệm |
| **Vercel + Render + GHCR** | Miễn phí, tự cấp HTTPS, deploy image qua Deploy Hook | Gói miễn phí có giới hạn (xem Hệ quả) |

## 2. Quyết định (Decision)
- **Web (Next.js):** Vercel, Root Directory `apps/web`. Next.js được phục vụ qua CDN của Vercel, HTTPS tự động. Pipeline CD deploy bằng `vercel deploy --prebuilt --prod`; tắt tự deploy từ Git để chỉ CD được deploy production.
- **API (NestJS):** Render Web Service loại *Existing Image*, chạy image `ghcr.io/<owner>/brewlite-api:<commit SHA>` (region Singapore). CD gọi Deploy Hook kèm `imgURL`, health check path `/api/health`.
- **Database:** Render PostgreSQL 16 cùng region; API chỉ kết nối qua *Internal Database URL*, không mở kết nối public.
- **Container registry:** GitHub Container Registry, tag theo commit SHA, semver (khi push tag) và `stable` (bản gần nhất đã qua smoke test, dùng để rollback).
- **Secret:** chỉ nằm trong Render, Vercel và GitHub Secrets; không có trong repository.

Chi tiết thiết lập: [`docs/deployment.md`](../../deployment.md). Sơ đồ: [`docs/diagrams/deployment-diagram.puml`](../../diagrams/deployment-diagram.puml).

## 3. Hệ quả (Consequences)
- **Tích cực:**
  - Không tốn chi phí, HTTPS có sẵn cho cả web và API.
  - Image dùng cho production chính là image đã build và kiểm thử trong CI (cùng commit SHA), có thể rollback bằng cách deploy lại một tag cũ.
  - Mỗi thành phần trong deployment diagram truy vết được tới mã nguồn: `apps/web` → Vercel, `apps/api/Dockerfile` → GHCR → Render, `apps/api/prisma` → Render PostgreSQL.
- **Tiêu cực:**
  - Gói miễn phí của Render cho service ngủ khi không có truy cập, nên request đầu tiên chậm (cold start); gói PostgreSQL miễn phí có giới hạn thời gian sử dụng. Nhóm phải kiểm tra URL production còn chạy trước ngày chấm.
  - Web (Vercel) và API (Render) ở hai nền tảng khác nhau nên rollback phải làm ở cả hai nơi; job `rollback` trong `cd.yml` xử lý cả hai.
