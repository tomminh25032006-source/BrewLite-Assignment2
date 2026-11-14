import { expect, test } from '@playwright/test';

// E2E-T01: Luồng end-to-end Xem menu -> Chọn tùy chọn -> Giỏ hàng -> Đặt đơn -> Thanh toán -> Theo dõi đơn
test('E2E-T01 khách đặt món và thanh toán thành công đến trang xác nhận đơn', async ({ page }) => {
  // 1. Xem menu
  await page.goto('/menu');
  await page.getByText('Cà Phê Sữa Đá Sài Gòn').click();

  // 2. Chọn tùy chọn và thêm vào giỏ
  await page.getByRole('button', { name: /Thêm vào giỏ/ }).click();
  await expect(page.getByText('Đã thêm vào giỏ!')).toBeVisible();

  // 3. Giỏ hàng
  await page.goto('/cart');
  await expect(page.getByText('Cà Phê Sữa Đá Sài Gòn')).toBeVisible();

  // Mã giảm giá do backend kiểm tra (GET /api/promotions/:code): 35.000đ chưa đủ điều kiện BREW10
  const voucher = page.getByPlaceholder('Nhập mã, ví dụ BREW10');
  await voucher.fill('BREW10');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText(/chỉ áp dụng cho đơn hàng từ/)).toBeVisible();
  await voucher.fill('brewnew');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('-15.000 đ')).toBeVisible();

  await page.getByRole('button', { name: /Tiến hành Thanh toán/ }).click();

  // 4. Chưa đăng nhập -> đăng nhập bằng tài khoản demo
  await page.getByRole('button', { name: /Điền nhanh tài khoản dùng thử/ }).click();
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // 5. Đặt đơn + thanh toán Ví mô phỏng (35.000đ - 15.000đ của BREWNEW)
  await page.getByRole('button', { name: /Xác nhận trả 20\.000/ }).click();

  // 6. Xác nhận và theo dõi đơn
  await expect(page).toHaveURL(/\/orders\/.+/);
  await expect(page.getByText('Thanh toán thành công')).toBeVisible();
  await expect(page.getByText(/#ORD-\d+/)).toBeVisible();
});

// E2E-T02: Nhân viên quầy chỉ dùng được KDS sau khi đăng nhập tài khoản STAFF; khách thấy trạng thái tự cập nhật
test('E2E-T02 nhân viên quầy nhận đơn trên KDS, trang theo dõi đơn của khách tự cập nhật', async ({
  page,
  browser,
  request,
  baseURL,
}) => {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:4000/api';

  // Khách đặt và thanh toán một đơn qua API
  const customer = await (
    await request.post(`${apiUrl}/auth/login`, {
      data: { email: 'customer@brewlite.vn', password: 'Password123!' },
    })
  ).json();
  const authHeader = { Authorization: `Bearer ${customer.accessToken}` };
  const order = await (
    await request.post(`${apiUrl}/orders`, {
      headers: authHeader,
      data: { items: [{ productId: 'prod_cf_01', size: 'S', qty: 1 }] },
    })
  ).json();
  const payment = await request.post(`${apiUrl}/payments`, {
    headers: { ...authHeader, 'Idempotency-Key': `e2e-t02-${Date.now()}` },
    data: { orderId: order.id, method: 'MOMO', amount: order.finalAmount },
  });
  expect(payment.ok()).toBeTruthy();

  // Khách mở trang theo dõi đơn
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('brewlite_token', token);
      localStorage.setItem('brewlite_user', JSON.stringify(user));
    },
    [customer.accessToken, customer.user],
  );
  await page.goto(`/orders/${order.id}`);
  await expect(page.getByText('Thanh toán thành công')).toBeVisible();

  // Nhân viên quầy dùng trình duyệt riêng: chưa đăng nhập thì KDS yêu cầu đăng nhập
  const kdsContext = await browser.newContext();
  const kds = await kdsContext.newPage();
  await kds.goto(`${baseURL}/staff`);
  await kds.getByRole('button', { name: 'Đăng nhập tài khoản nhân viên' }).click();
  await kds.getByRole('button', { name: /Điền nhanh tài khoản dùng thử/ }).click();
  await kds.getByRole('button', { name: 'Đăng nhập ngay' }).click();

  const card = kds.locator('div.rounded-2xl', { hasText: `#${order.orderCode}` }).first();
  await card.getByRole('button', { name: /Nhận Đơn/ }).click();
  await expect(card.getByText('Đang pha chế')).toBeVisible();
  await kdsContext.close();

  // Trang của khách tự tải lại trạng thái, không cần F5
  await expect(page.getByText('Đang chuẩn bị món')).toBeVisible({ timeout: 15_000 });
});
