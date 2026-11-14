import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { auth, createTestApp, loginAs, registerUser, resetDatabase } from './helpers';

describe('INT - Tạo đơn & Thanh toán (HTTP + PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const http = () => request(app.getHttpServer());

  const createOrder = (body: object) =>
    http().post('/api/orders').set(auth(token)).send(body);

  const pay = (orderId: string, key: string, extra: object = {}) =>
    http()
      .post('/api/payments')
      .set(auth(token))
      .set('Idempotency-Key', key)
      .send({ orderId, method: 'MOMO', amount: 0, ...extra });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    token = await registerUser(app, 'buyer');
  });

  afterAll(async () => {
    await app.close();
  });

  it('INT-T01 POST /orders cần JWT', async () => {
    await http()
      .post('/api/orders')
      .send({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] })
      .expect(401);
  });

  it('INT-T02 tạo đơn PENDING, giá topping do backend tính', async () => {
    const res = await createOrder({
      items: [{ productId: 'prod_cf_01', size: 'M', toppingIds: ['top_02'], qty: 2 }],
      promotionCode: 'BREW10',
    }).expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.items[0].unitPrice).toBe(35000 + 5000 + 10000);
    expect(res.body.total).toBe(100000);
    expect(res.body.discountAmount).toBe(10000);
    expect(res.body.finalAmount).toBe(90000);
  });

  it('INT-T03 validate đơn hàng: giỏ trống, size sai, topping lạ, giá client gửi lên', async () => {
    await createOrder({ items: [] }).expect(400);
    await createOrder({ items: [{ productId: 'prod_cf_01', size: 'XL', qty: 0 }] }).expect(400);
    await createOrder({
      items: [{ productId: 'prod_cf_01', size: 'S', toppingIds: ['top_fake'], qty: 1 }],
    }).expect(400);
    await createOrder({
      items: [
        { productId: 'prod_cf_01', size: 'S', qty: 1, selectedToppings: [{ name: 'X', price: 0 }] },
      ],
    }).expect(400);
  });

  it('INT-T04 tạo đơn vượt tồn kho trả 409', async () => {
    await createOrder({ items: [{ productId: 'prod_ice_02', size: 'S', qty: 999 }] }).expect(409);
  });

  it('INT-T05 thanh toán thành công: PAID, trừ kho, cộng điểm, ghi LoyaltyTransaction', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 2 }] }).expect(201)
    ).body;

    const res = await pay(order.id, 'key-success').expect(201);
    expect(res.body).toMatchObject({ status: 'SUCCESS', orderStatus: 'PAID', loyaltyPointsAdded: 7 });

    const product = await prisma.product.findUnique({ where: { id: 'prod_cf_01' } });
    expect(product!.stock).toBe(48);
    expect(product!.version).toBe(1);
    expect(await prisma.loyaltyTransaction.count({ where: { orderId: order.id } })).toBe(1);

    const detail = await http().get(`/api/orders/${order.id}`).set(auth(token)).expect(200);
    expect(detail.body.status).toBe('PAID');
  });

  it('INT-T06 gửi lại cùng Idempotency-Key chỉ tạo 1 giao dịch', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;

    const first = await pay(order.id, 'key-dup').expect(201);
    const second = await pay(order.id, 'key-dup').expect(201);

    expect(second.body.idempotentReplay).toBe(true);
    expect(second.body.paymentId).toBe(first.body.paymentId);
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
    const product = await prisma.product.findUnique({ where: { id: 'prod_cf_01' } });
    expect(product!.stock).toBe(49);
  });

  it('INT-T07 thanh toán lỗi 2 lần liên tiếp rồi thử lại thành công', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;

    const fail1 = await pay(order.id, 'key-f1', { simulateFailure: true }).expect(201);
    expect(fail1.body).toMatchObject({ status: 'FAILED', orderStatus: 'PAYMENT_FAILED' });
    const fail2 = await pay(order.id, 'key-f2', { simulateFailure: true }).expect(201);
    expect(fail2.body.status).toBe('FAILED');

    const ok = await pay(order.id, 'key-f3').expect(201);
    expect(ok.body.orderStatus).toBe('PAID');
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(3);
  });

  it('INT-T08 thanh toán lỗi giữa chừng thì rollback toàn bộ (transaction)', async () => {
    const order = (
      await createOrder({
        items: [
          { productId: 'prod_cf_02', size: 'S', qty: 1 },
          { productId: 'prod_cf_03', size: 'S', qty: 2 },
        ],
      }).expect(201)
    ).body;

    // Món thứ 2 bị bán hết sau khi đơn được tạo
    await prisma.product.update({ where: { id: 'prod_cf_03' }, data: { stock: 1 } });

    await pay(order.id, 'key-rollback').expect(409);

    const first = await prisma.product.findUnique({ where: { id: 'prod_cf_02' } });
    expect(first!.stock).toBe(40);
    expect(first!.version).toBe(0);
    const saved = await prisma.order.findUnique({ where: { id: order.id } });
    expect(saved!.status).toBe('PENDING');
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(0);
    expect(await prisma.loyaltyTransaction.count({ where: { orderId: order.id } })).toBe(0);
  });

  it('INT-T09 nhiều khách thanh toán đồng thời không bán vượt tồn kho', async () => {
    await prisma.product.update({ where: { id: 'prod_ice_02' }, data: { stock: 2 } });

    const orders = [];
    for (let i = 0; i < 5; i++) {
      orders.push(
        (await createOrder({ items: [{ productId: 'prod_ice_02', size: 'S', qty: 1 }] }).expect(201))
          .body,
      );
    }

    const results = await Promise.all(orders.map((o, i) => pay(o.id, `key-concurrent-${i}`)));
    const paid = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 409);

    expect(paid).toHaveLength(2);
    expect(rejected).toHaveLength(3);
    const product = await prisma.product.findUnique({ where: { id: 'prod_ice_02' } });
    expect(product!.stock).toBe(0);
  });

  it('INT-T11 lịch sử đơn chỉ gồm đơn của chính khách, mới nhất lên đầu', async () => {
    const first = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    const second = (
      await createOrder({ items: [{ productId: 'prod_tea_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    const other = await registerUser(app, 'other');
    await http()
      .post('/api/orders')
      .set(auth(other))
      .send({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] })
      .expect(201);

    const res = await http().get('/api/orders/me').set(auth(token)).expect(200);
    expect(res.body.map((o: { id: string }) => o.id)).toEqual([second.id, first.id]);
  });

  it('INT-T10 nhân viên quầy xem toàn bộ đơn và chuyển trạng thái theo State Machine', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    await pay(order.id, 'key-staff').expect(201);

    const staff = await loginAs(app, 'barista@brewlite.vn');
    const all = await http().get('/api/orders').set(auth(staff)).expect(200);
    expect(all.body.map((o: { id: string }) => o.id)).toContain(order.id);
    await http().get(`/api/orders/${order.id}`).set(auth(staff)).expect(200);

    const patch = (status: string) =>
      http().patch(`/api/orders/${order.id}/status`).set(auth(staff)).send({ status });
    await patch('COMPLETED').expect(400);
    await patch('PREPARING').expect(200);
    await patch('READY').expect(200);
    const done = await patch('COMPLETED').expect(200);
    expect(done.body.status).toBe('COMPLETED');
  });

  it('INT-T12 chỉ nhân viên quầy được xem đơn cả quán và đổi trạng thái; không ai đặt PAID bằng tay', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    const patch = (status: string) =>
      http().patch(`/api/orders/${order.id}/status`).send({ status });

    await patch('PAID').expect(401);
    await patch('CANCELLED').expect(401);
    await patch('PAID').set(auth(token)).expect(403);
    await http().get('/api/orders').set(auth(token)).expect(403);

    const staff = await loginAs(app, 'barista@brewlite.vn');
    await patch('PAID').set(auth(staff)).expect(400);
    await patch('PAYMENT_FAILED').set(auth(staff)).expect(400);

    const saved = await prisma.order.findUnique({ where: { id: order.id } });
    expect(saved!.status).toBe('PENDING');
  });

  it('INT-T13 thanh toán đồng thời cùng một đơn bằng nhiều key chỉ trừ tiền và trừ kho một lần', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;

    const results = await Promise.all(
      [0, 1, 2, 3, 4].map((i) => pay(order.id, `key-same-order-${i}`)),
    );

    // Request đến sau bị chặn: 409 nếu chạy song song, 400 nếu đơn đã PAID trước khi nó đọc
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => [400, 409].includes(r.status))).toHaveLength(4);
    expect(
      await prisma.payment.count({ where: { orderId: order.id, status: 'SUCCESS' } }),
    ).toBe(1);
    expect(await prisma.loyaltyTransaction.count({ where: { orderId: order.id } })).toBe(1);
    const product = await prisma.product.findUnique({ where: { id: 'prod_cf_01' } });
    expect(product!.stock).toBe(49);
  });

  it('INT-T14 khách khác không xem, không thanh toán, không hủy được đơn', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    const other = await registerUser(app, 'other');

    await http().get(`/api/orders/${order.id}`).set(auth(other)).expect(404);
    await http().get(`/api/orders/${order.orderCode}`).set(auth(other)).expect(404);
    await http()
      .post('/api/payments')
      .set(auth(other))
      .set('Idempotency-Key', 'key-idor')
      .send({ orderId: order.id, method: 'MOMO', amount: 0 })
      .expect(404);
    await http().post(`/api/orders/${order.id}/cancel`).set(auth(other)).expect(404);

    const saved = await prisma.order.findUnique({ where: { id: order.id } });
    expect(saved!.status).toBe('PENDING');
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(0);
  });

  it('INT-T15 dùng lại Idempotency-Key của đơn khác bị từ chối', async () => {
    const first = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    const second = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;

    await pay(first.id, 'key-reused').expect(201);
    await pay(second.id, 'key-reused').expect(409);

    const saved = await prisma.order.findUnique({ where: { id: second.id } });
    expect(saved!.status).toBe('PENDING');
  });

  it('INT-T16 khách hủy đơn chưa thanh toán; đơn đã thanh toán hoặc đã hủy thì không hủy/trả tiền được', async () => {
    const order = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    await pay(order.id, 'key-before-cancel', { simulateFailure: true }).expect(201);

    const cancelled = await http()
      .post(`/api/orders/${order.id}/cancel`)
      .set(auth(token))
      .expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');
    await pay(order.id, 'key-after-cancel').expect(400);

    const paid = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    await pay(paid.id, 'key-paid').expect(201);
    await http().post(`/api/orders/${paid.id}/cancel`).set(auth(token)).expect(400);
  });

  it('INT-T17 nhân viên hủy đơn đã thanh toán: hoàn tồn kho, thu hồi điểm; đơn chưa thanh toán không cộng kho', async () => {
    const staff = await loginAs(app, 'barista@brewlite.vn');
    const cancel = (orderId: string) =>
      http().patch(`/api/orders/${orderId}/status`).set(auth(staff)).send({ status: 'CANCELLED' });

    const paid = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 2 }] }).expect(201)
    ).body;
    await pay(paid.id, 'key-staff-cancel').expect(201);
    expect((await prisma.product.findUnique({ where: { id: 'prod_cf_01' } }))!.stock).toBe(48);

    const res = await cancel(paid.id).expect(200);
    expect(res.body.status).toBe('CANCELLED');

    const product = await prisma.product.findUnique({ where: { id: 'prod_cf_01' } });
    expect(product!.stock).toBe(50);
    const me = await http().get('/api/auth/me').set(auth(token)).expect(200);
    expect(me.body.loyaltyPoints).toBe(0);
    const txns = await prisma.loyaltyTransaction.findMany({
      where: { orderId: paid.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(txns.map((t) => t.points)).toEqual([7, -7]);

    // Hủy lần nữa bị State Machine chặn, không hoàn kho thêm
    await cancel(paid.id).expect(400);
    expect((await prisma.product.findUnique({ where: { id: 'prod_cf_01' } }))!.stock).toBe(50);

    // Đơn PENDING chưa trừ kho nên hủy không được cộng thêm kho
    const pending = (
      await createOrder({ items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] }).expect(201)
    ).body;
    await cancel(pending.id).expect(200);
    expect((await prisma.product.findUnique({ where: { id: 'prod_cf_01' } }))!.stock).toBe(50);
  });
});
