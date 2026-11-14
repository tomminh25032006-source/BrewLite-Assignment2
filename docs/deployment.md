# TÀI LIỆU TRIỂN KHAI VÀ VẬN HÀNH (DEPLOYMENT & OPERATIONS GUIDE)
## DỰ ÁN: BREWLITE – CASHLESS COFFEE ORDERING SYSTEM
> **Mã tài liệu:** `OPS-DOC-01` | **Phiên bản:** VER 1.1
> **Thuộc nhiệm vụ:** Task 3.2, Task 5.3 & Task 5.4 – Triển khai, CI/CD, bàn giao và rollback
> **Sơ đồ:** [`diagrams/deployment-diagram.puml`](./diagrams/deployment-diagram.puml)

---

## 1. HẠ TẦNG PRODUCTION

| Thành phần | Nền tảng | Mã nguồn | Ghi chú |
| :--- | :--- | :--- | :--- |
| Web (Next.js, PWA) | **Vercel** (CDN, HTTPS) | `apps/web` | Project Vercel có *Root Directory* = `apps/web` |
| API (NestJS) | **Render** – Web Service loại *Existing Image* | `apps/api` (`Dockerfile`) | Kéo image `ghcr.io/<owner>/brewlite-api:<commit SHA>` |
| Container registry | **GitHub Container Registry (GHCR)** | `.github/workflows/cd.yml` | Tag theo commit SHA, semver (khi push tag) và `stable` |
| Database | **Render PostgreSQL 16** | `apps/api/prisma` | Chỉ dùng *Internal Database URL*; không mở kết nối public |

| URL | Giá trị |
| :--- | :--- |
| Web production | `<điền URL Vercel thật, ví dụ https://brewlite-xxx.vercel.app>` |
| API production | `<điền URL Render thật, ví dụ https://brewlite-api-xxx.onrender.com>/api` |
| Health check | `<API production>/api/health` |

---

## 2. BIẾN MÔI TRƯỜNG VÀ SECRET

Không commit file `.env`. Mọi secret chỉ nằm trong Render, Vercel và GitHub Secrets.

### 2.1. API (Render → Environment)
| Biến | Ví dụ | Loại |
| :--- | :--- | :---: |
| `DATABASE_URL` | Internal Database URL của Render PostgreSQL | Secret |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự (thiếu biến này API sẽ không khởi động) | Secret |
| `JWT_EXPIRES_IN` | `7d` | Config |
| `PORT` | `4000` | Config |
| `NODE_ENV` | `production` | Config |

Health Check Path trên Render: `/api/health`.

### 2.2. Web (Vercel → Environment Variables)
| Biến | Ví dụ |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://<api-production>/api` |

### 2.3. GitHub (Settings → Secrets and variables → Actions)
| Tên | Loại | Dùng cho |
| :--- | :---: | :--- |
| `RENDER_DEPLOY_HOOK_URL` | Secret | Deploy API với image theo SHA, rollback |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Secret | Deploy và rollback web |
| `API_URL`, `WEB_URL` | Variable | Smoke test sau triển khai |

---

## 3. THIẾT LẬP LẦN ĐẦU

1. **Render PostgreSQL:** tạo database `brewlite-db` (PostgreSQL 16, region Singapore). Sao chép *Internal Database URL*.
2. **GHCR:** chạy pipeline CD một lần (push lên `main`) để tạo package `brewlite-api`. Vào *Packages → brewlite-api → Package settings* đặt **Public**, hoặc khai báo registry credential trong Render.
3. **Render Web Service:** *New → Web Service → Existing Image*, nhập `ghcr.io/<owner>/brewlite-api:stable` (hoặc tag SHA), cùng region với database. Khai báo biến ở mục 2.1, Health Check Path `/api/health`. Sao chép *Deploy Hook* vào secret `RENDER_DEPLOY_HOOK_URL`.
4. **Vercel:** *Import* repository, Root Directory `apps/web`, thêm `NEXT_PUBLIC_API_URL`. Tắt *Automatic Git deployments* cho nhánh `main` để chỉ pipeline CD deploy production. Lấy token, org ID, project ID (file `.vercel/project.json` sau khi chạy `npx vercel link`).
5. Điền `API_URL`, `WEB_URL` vào GitHub Variables, cập nhật URL thật vào mục 1 và `README.md`.

---

## 4. PIPELINE CD (`.github/workflows/cd.yml`)

Kích hoạt khi push lên `main` hoặc push tag `v*.*.*`:

| Bước | Job | Nội dung |
| :--: | :--- | :--- |
| 1 | `quality-gate` | Gọi lại `ci.yml`: lint, unit test, integration test, build, E2E |
| 2 | `image` | Build `apps/api/Dockerfile`, push `ghcr.io/<owner>/brewlite-api:<SHA>` (thêm tag semver khi push tag) |
| 3 | `deploy-api` | Gọi Render Deploy Hook với `imgURL=<image:SHA>`, chờ `/api/health` trả `commit` đúng SHA vừa build và `database: up` (Render giữ bản cũ chạy trong lúc deploy, nên chỉ kiểm tra `database: up` là chưa đủ) |
| 4 | `deploy-web` | `vercel build --prod` + `vercel deploy --prebuilt --prod` |
| 5 | `smoke-test` | Health check (`status: healthy`, đúng `commit`), `/api/products`, trang `/` và `/menu` |
| 6 | `promote` | Gắn tag `stable` cho image vừa chạy tốt |
| 7 | `rollback` | Chỉ chạy khi bước 3–5 lỗi: deploy lại image `stable`, `vercel rollback`, pipeline kết thúc **failed**. Lần deploy đầu chưa có `stable` thì bỏ qua rollback API, chỉ báo lỗi để sửa và deploy lại |

---

## 5. MIGRATION AN TOÀN

- Thay đổi schema: sửa `apps/api/prisma/schema.prisma` → `npm run prisma:migrate:dev -- --name <ten>` → commit thư mục `prisma/migrations/` qua pull request.
- Khi container API khởi động: `npx prisma migrate deploy` (chỉ áp dụng migration đã commit, không drop/reset dữ liệu) → `node dist-seed/seed.js` (seed idempotent, không ghi đè tồn kho) → `node dist/main`.
- Migration lỗi → container không khởi động → health check không đạt → job `deploy-api` fail → job `rollback` chạy.
- Chỉ viết migration theo hướng tương thích ngược (thêm cột nullable/có default trước, xóa cột ở bản phát hành sau) để image `stable` cũ vẫn chạy được sau khi rollback.

---

## 6. ROLLBACK

**Tự động:** job `rollback` của CD (mục 4).

**Thủ công:**
```bash
# API: deploy lại image của một commit ổn định
curl -X POST -G "$RENDER_DEPLOY_HOOK_URL" --data-urlencode "imgURL=ghcr.io/<owner>/brewlite-api:<SHA ổn định>"

# Web: quay về bản production trước đó
npx vercel rollback --token "$VERCEL_TOKEN"

# Hoặc revert commit lỗi và để pipeline CD chạy lại
git revert <sha-loi> && git push origin main
```
Trên giao diện: Render → *Events* → *Rollback*; Vercel → *Deployments* → *Instant Rollback*.

---

## 7. GIÁM SÁT

- `GET /api/health` → `200 {"status":"healthy","database":"up","commit":"<SHA>",...}`; mất kết nối DB → `503`. Trường `commit` (biến môi trường `GIT_SHA` ghi vào image lúc build) cho biết production đang chạy bản nào.
- Log API: Render → *Logs* (stdout của NestJS). Log web: Vercel → *Logs*.
- Docker image có `HEALTHCHECK` gọi `/api/health` mỗi 15 giây.
