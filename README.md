# ☕ BrewLite — Cashless Coffee Ordering System
> **Môn học:** Công nghệ Phần mềm — Khoa CNTT, Trường Đại học Sài Gòn — Học kỳ I (2026–2027)
> **Bài tập lớn:** Assignment 2 – Requirements to Deployment (VER 1.0)
> **Trạng thái:** đang thực hiện Task 1 → Task 5 theo thứ tự của đề.

BrewLite là web-app đặt cà phê và thanh toán không dùng tiền mặt:

**Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn**

- **Khách hàng:** duyệt menu trên điện thoại, chọn size/topping, áp mã giảm giá, thanh toán Ví/Thẻ mô phỏng (idempotent), theo dõi mã đơn `#ORD-XXXXXX`.
- **Nhân viên quầy – vai trò `STAFF` (KDS `/staff`):** xem toàn bộ đơn đã thanh toán và cập nhật `PREPARING → READY → COMPLETED`.
- **Backend:** state machine đơn hàng, transaction + optimistic locking chống bán vượt tồn kho, Idempotency-Key chống trừ tiền hai lần, tích điểm loyalty.

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

