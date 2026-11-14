FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma/
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Prisma engine trên Alpine cần OpenSSL
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed

# Commit SHA của bản build, trả ra ở GET /api/health (đặt cuối để không làm mất cache các layer trên)
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

# Migration an toàn: chỉ áp dụng các migration đã commit, sau đó seed idempotent rồi khởi động API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist-seed/seed.js && node dist/main"]
