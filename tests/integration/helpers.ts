import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../apps/api/src/app.module';
import { configureApp } from '../../apps/api/src/app.setup';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { seedDatabase } from '../../apps/api/prisma/seed';

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: false }));
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

// Xóa dữ liệu giao dịch và đưa menu/tồn kho về trạng thái seed
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.payment.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  const log = console.log;
  console.log = () => undefined;
  try {
    await seedDatabase(prisma, true);
  } finally {
    console.log = log;
  }
}

export async function registerUser(app: INestApplication, name: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email: `${name}-${Date.now()}@test.vn`, password: 'Secret123', fullName: name })
    .expect(201);
  return res.body.accessToken;
}

// Đăng nhập tài khoản có sẵn trong seed (customer@brewlite.vn, barista@brewlite.vn)
export async function loginAs(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password123!' })
    .expect(201);
  return res.body.accessToken;
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
