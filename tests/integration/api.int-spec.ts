import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { auth, createTestApp, registerUser, resetDatabase } from './helpers';

describe('API - Health, Products, Auth (HTTP + PostgreSQL)', () => {
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

  it('API-T06 GET /api/promotions/:code tính số tiền giảm ở backend, mã sai hoặc chưa đủ điều kiện trả 400', async () => {
    const brew10 = await request(app.getHttpServer())
      .get('/api/promotions/brew10?subtotal=60000')
      .expect(200);
    expect(brew10.body).toMatchObject({ code: 'BREW10', discountAmount: 6000, finalAmount: 54000 });

    const capped = await request(app.getHttpServer())
      .get('/api/promotions/BREW10?subtotal=500000')
      .expect(200);
    expect(capped.body.discountAmount).toBe(30000);

    const fixed = await request(app.getHttpServer())
      .get('/api/promotions/BREWNEW?subtotal=10000')
      .expect(200);
    expect(fixed.body).toMatchObject({ discountAmount: 10000, finalAmount: 0 });

    await request(app.getHttpServer()).get('/api/promotions/BREW10?subtotal=40000').expect(400);
    await request(app.getHttpServer()).get('/api/promotions/BREWLITE10?subtotal=60000').expect(400);
    await request(app.getHttpServer()).get('/api/promotions/BREW10?subtotal=abc').expect(400);
    await request(app.getHttpServer()).get('/api/promotions/BREW10').expect(400);
  });

  it('API-T03 đăng ký, đăng nhập, lấy hồ sơ bằng JWT', async () => {
    const token = await registerUser(app, 'auth');
    const me = await request(app.getHttpServer()).get('/api/auth/me').set(auth(token)).expect(200);
    expect(me.body.loyaltyPoints).toBe(0);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'customer@brewlite.vn', password: 'Password123!' })
      .expect(201);
    expect(login.body.accessToken).toBeDefined();
  });

  it('API-T04 validate dữ liệu đăng ký và từ chối sai mật khẩu / token giả', async () => {
    const bad = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'abc', password: '1', fullName: '' })
      .expect(400);
    expect(bad.body.message.length).toBeGreaterThanOrEqual(3);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'customer@brewlite.vn', password: 'sai' })
      .expect(401);
    await request(app.getHttpServer()).get('/api/auth/me').set(auth('abc.def.ghi')).expect(401);
  });
});
