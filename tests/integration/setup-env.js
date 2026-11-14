// Luôn dùng database riêng cho test vì test sẽ xóa dữ liệu đơn hàng
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://brewuser:brewpass@localhost:5432/brewlite_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';
