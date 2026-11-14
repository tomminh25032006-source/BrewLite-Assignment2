# ☕ BrewLite — Cashless Coffee Ordering System
> **Môn học:** Công nghệ Phần mềm — Khoa CNTT, Trường Đại học Sài Gòn — Học kỳ I (2026–2027)
> **Bài tập lớn:** Assignment 2 – Requirements to Deployment (VER 1.0)

BrewLite là web-app đặt cà phê và thanh toán không dùng tiền mặt:

**Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn**

- **Khách hàng:** duyệt menu trên điện thoại, chọn size/topping, áp mã giảm giá, thanh toán Ví/Thẻ mô phỏng (idempotent), theo dõi mã đơn `#ORD-XXXXXX`.
- **Nhân viên quầy – vai trò `STAFF` (KDS `/staff`):** xem toàn bộ đơn đã thanh toán và cập nhật `PREPARING → READY → COMPLETED`.
- **Backend:** state machine đơn hàng, transaction + optimistic locking chống bán vượt tồn kho, Idempotency-Key chống trừ tiền hai lần, tích điểm loyalty.

---

## 🌐 Production

| Thành phần | URL |
| :--- | :--- |
| Web (HTTPS) | [https://brew-lite-assignment2.vercel.app](https://brew-lite-assignment2.vercel.app) |
| API | [https://brewlite-api-n0j4.onrender.com/api](https://brewlite-api-n0j4.onrender.com/api/products) |
| Health check | [https://brewlite-api-n0j4.onrender.com/api/health](https://brewlite-api-n0j4.onrender.com/api/health) |
| Demo end-to-end | Demo trực tiếp trên URL production khi chấm (kịch bản: [`docs/sprint-retrospective.md`](docs/sprint-retrospective.md) §2.1) |
| Product Backlog / Issue board | [GitHub Project – BrewLite Product Backlog](https://github.com/users/tomminh25032006-source/projects/1) · [Issues](https://github.com/tomminh25032006-source/BrewLite-Assignment2/issues?q=is%3Aissue) · [Milestones](https://github.com/tomminh25032006-source/BrewLite-Assignment2/milestones?state=closed) |
| Release | [`v1.0.0`](CHANGELOG.md) |

---

## 🛠️ Công nghệ

| Thành phần | Công nghệ |
| :--- | :--- |
| Web | Next.js 14 (App Router, mobile-first, PWA manifest), TailwindCSS, Zustand |
| API | NestJS 10, Passport JWT, bcryptjs, class-validator |
| Database | PostgreSQL 16 + Prisma ORM (schema, migrations, seed) |
| Thanh toán | Payment Service mô phỏng (MoMo, VNPay, Thẻ) với `Idempotency-Key` |
| Test | Jest, Testing Library, Supertest, Playwright |
| DevOps | Docker, Docker Compose, GitHub Actions (CI + CD), GHCR, Render, Vercel |

---

## 📂 Cấu trúc repository

```text
brewlite/
├── apps/
│   ├── web/                    # Next.js mobile-first/PWA
│   │   ├── public/manifest.json
│   │   └── src/ (app, components, stores, services, __tests__)
│   └── api/                    # NestJS
│       ├── prisma/             # schema.prisma, migrations/, seed.ts
│       └── src/ (modules: auth, products, orders, payments, promotions; prisma; app.controller: health)
├── docs/
│   ├── requirements/           # Task 1: context-and-scope, srs, user-stories, use-case-checkout
│   ├── diagrams/               # Task 1–3: use-case, activity, sequence, class, deployment (.puml + .svg)
│   ├── architecture/           # Task 3: architecture-overview, adr/ (ADR-001 … ADR-008)
│   ├── traceability-matrix.md
│   ├── deployment.md
│   ├── ci-evidence.md
│   └── sprint-retrospective.md
├── tests/
│   ├── integration/            # API test qua HTTP + PostgreSQL
│   └── e2e/                    # Playwright
├── .github/workflows/          # ci.yml, cd.yml
├── docker-compose.yml
├── .env.example
├── CHANGELOG.md
└── README.md
```

---

## 🚀 Chạy local

### Cách 1 – Docker Compose (khuyên dùng)
Yêu cầu: Docker Desktop.
```bash
cp .env.example .env          # đổi JWT_SECRET
docker compose up --build
```
- Web: http://localhost:3000 — KDS nhân viên quầy: http://localhost:3000/staff
- API: http://localhost:4000/api — Health: http://localhost:4000/api/health
- Container API tự chạy `prisma migrate deploy` và seed dữ liệu mẫu. Dữ liệu nằm trong volume `postgres_data`.
- Tài khoản demo (mật khẩu `Password123!`): khách hàng `customer@brewlite.vn`; barista `barista@brewlite.vn` (chỉ tài khoản vai trò `STAFF` mở được `/staff`). Mã giảm giá: `BREW10`, `BREWNEW`.
- Nếu cổng `5432`, `4000` hoặc `3000` đã bị chương trình khác dùng, đổi `POSTGRES_PORT`, `API_PORT`, `WEB_PORT` trong `.env` (đổi `API_PORT` thì sửa luôn `NEXT_PUBLIC_API_URL` cho khớp) rồi chạy lại `docker compose up --build`.

### Cách 2 – Chạy từng phần (Node.js 20+)
```bash
# 1. PostgreSQL
cp .env.example .env
docker compose up -d postgres-db

# 2. API
cd apps/api
cp .env.example .env          # sửa DATABASE_URL, JWT_SECRET
npm ci
npm run prisma:migrate:dev    # tạo bảng từ prisma/migrations
npm run prisma:seed
npm run start:dev             # http://localhost:4000/api

# 3. Web
cd apps/web
npm ci
npm run dev                   # http://localhost:3000
```

---

## 🧪 Kiểm thử

| Loại | Lệnh | Số test |
| :--- | :--- | :---: |
| Unit test API | `cd apps/api && npm test` | 35 |
| Unit/component test web | `cd apps/web && npm test` | 7 |
| Integration test (HTTP + PostgreSQL) | `cd apps/api && TEST_DATABASE_URL=postgresql://brewuser:brewpass@localhost:5432/brewlite_test npm run test:integration` | 24 |
| E2E (Playwright) | `npm ci && npx playwright install chromium && docker compose up -d --build && npm run test:e2e` (ở thư mục gốc) | 2 |
| Lint | `npm run lint` trong `apps/api` và `apps/web` | – |

Integration test dùng database riêng `brewlite_test` và xóa dữ liệu đơn hàng trước mỗi test, không trỏ vào database thật. Danh sách mã test và truy vết: [`docs/traceability-matrix.md`](docs/traceability-matrix.md).

---

## 📦 Build

```bash
cd apps/api && npm run build      # dist/main.js + dist-seed/seed.js
cd apps/web && npm run build
docker compose build              # build cả hai image
```

---

## 🚢 Deploy và Rollback

- **CI** ([`ci.yml`](.github/workflows/ci.yml)): mỗi pull request chạy Install → Lint → Unit Test → Integration Test → Build → E2E.
- **CD** ([`cd.yml`](.github/workflows/cd.yml)): push lên `main` hoặc tag `v*.*.*` → quality gate → build image `ghcr.io/tomminh25032006-source/brewlite-api:<SHA>` → push GHCR → deploy Render (migration chạy khi container khởi động) → deploy Vercel → smoke test `/api/health` → gắn tag `stable`.
- **Xác nhận bản mới:** image được build kèm `GIT_SHA`; `/api/health` trả `commit`, pipeline chỉ đi tiếp khi API production đang chạy đúng commit vừa deploy.
- **Rollback tự động:** deploy hoặc smoke test lỗi → deploy lại image `stable` và `vercel rollback`, pipeline báo failed. Lần deploy đầu (chưa có `stable`) thì bỏ qua rollback API và chỉ báo lỗi.
- **Rollback thủ công:**
  ```bash
  curl -X POST -G "$RENDER_DEPLOY_HOOK_URL" --data-urlencode "imgURL=ghcr.io/tomminh25032006-source/brewlite-api:<SHA ổn định>"
  npx vercel rollback --token "$VERCEL_TOKEN"
  ```

Chi tiết thiết lập Render/Vercel/GHCR và danh sách secret: [`docs/deployment.md`](docs/deployment.md).

---

## 🔀 Quy trình làm việc

### Branch strategy
- `main`: bản production, chỉ nhận merge từ `develop` (release) hoặc `hotfix/*`. Mỗi lần merge chạy CD.
- `develop`: nhánh tích hợp của Sprint.
- `feature/<mã-issue>-<mô-tả>`, `fix/<...>`, `docs/<...>`: tạo từ `develop`, merge lại qua **pull request**.
- `main` và `develop` bật branch protection: bắt buộc PR, ít nhất 1 reviewer, CI (`api`, `web`, `e2e`) phải pass.
- Mọi thay đổi yêu cầu, sơ đồ, kiến trúc trong `docs/` cũng đi qua PR và ghi rõ lý do trong mô tả PR.

### Commit convention
Theo [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <mô tả>`
- `type`: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`
- `scope`: `web`, `api`, `db`, `docs`, `ci`…
- Ví dụ: `feat(api): kiểm tra tồn kho khi tạo đơn`, `docs(diagrams): cập nhật class diagram theo schema`

### Definition of Done
Một user story / issue được coi là xong khi:
1. Code đã merge vào `develop` qua PR có ít nhất 1 người review.
2. CI pass: lint, unit test, integration test, build, E2E.
3. Có test cho tiêu chí chấp nhận trong `docs/requirements/srs.md`.
4. `docs/traceability-matrix.md` và sơ đồ liên quan đã cập nhật nếu yêu cầu/thiết kế thay đổi.
5. Migration (nếu có) đã commit và chạy được bằng `prisma migrate deploy`.
6. Chạy được bằng `docker compose up --build`.

---

## 📚 Tài liệu

| Task | Tài liệu |
| :--- | :--- |
| 1 – Yêu cầu | [context-and-scope](docs/requirements/context-and-scope.md), [srs](docs/requirements/srs.md), [user-stories](docs/requirements/user-stories.md), [use-case-checkout](docs/requirements/use-case-checkout.md), sơ đồ use-case [tổng quát](docs/diagrams/use-case-overview.puml) và [UC-01](docs/diagrams/use-case-checkout.puml) |
| 2 – Mô hình hóa | [activity](docs/diagrams/activity-checkout.puml), [sequence](docs/diagrams/sequence-checkout.puml), [class](docs/diagrams/class-domain.puml) (kèm `.svg`) |
| 3 – Kiến trúc | [architecture-overview](docs/architecture/architecture-overview.md), [ADR-001 … ADR-008](docs/architecture/adr/), [deployment-diagram](docs/diagrams/deployment-diagram.puml) |
| 4 – Sprint 1 | [ci-evidence](docs/ci-evidence.md) |
| 5 – Sprint 2 | [deployment](docs/deployment.md), [sprint-retrospective](docs/sprint-retrospective.md), [CHANGELOG](CHANGELOG.md) |
| 8 – Truy vết | [traceability-matrix](docs/traceability-matrix.md) |

Render lại sơ đồ sau khi sửa `.puml`:
```bash
docker run --rm -v "$(pwd)/docs/diagrams:/data" plantuml/plantuml:1.2024.8 -tsvg -charset UTF-8 /data/*.puml
```
