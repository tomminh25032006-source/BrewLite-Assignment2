import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { createTestApp, resetDatabase } from './helpers';

describe('API - Health, Products (HTTP + PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('API-T00 GET /api/health trả healthy khi kết nối được DB', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'healthy', database: 'up', commit: 'dev' });
  });

  it('API-T05 GET /api/health trả commit SHA của bản đang chạy (CD dùng để xác nhận bản mới đã lên)', async () => {
    process.env.GIT_SHA = 'abc1234';
    try {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.body.commit).toBe('abc1234');
    } finally {
      delete process.env.GIT_SHA;
    }
  });

  it('API-T01 GET /api/products trả danh sách menu từ database (NFR-01: < 500ms)', async () => {
    const started = Date.now();
    const res = await request(app.getHttpServer()).get('/api/products').expect(200);
    expect(Date.now() - started).toBeLessThan(500);
    expect(res.body.length).toBe(8);
    expect(res.body[0]).toHaveProperty('sizeOptions');
    expect(res.body[0]).toHaveProperty('toppingOptions');

    const coffee = await request(app.getHttpServer())
      .get('/api/products?category=COFFEE')
      .expect(200);
    expect(coffee.body.every((p: { category: string }) => p.category === 'COFFEE')).toBe(true);
  });

  it('API-T02 GET /api/products/:id trả chi tiết, ID sai trả 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/products/prod_cf_01').expect(200);
    expect(res.body).toMatchObject({ id: 'prod_cf_01', price: 35000 });
    await request(app.getHttpServer()).get('/api/products/khong_ton_tai').expect(404);
  });
});
