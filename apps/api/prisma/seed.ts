import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { INITIAL_PRODUCTS } from './seed-data';

// Seed idempotent: chạy lại nhiều lần vẫn cho ra cùng một bộ dữ liệu mẫu.
// resetStock = true đưa tồn kho về giá trị ban đầu (dùng cho integration test).
export async function seedDatabase(prisma: PrismaClient, resetStock = false) {
  // 1. Tài khoản demo
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'customer@brewlite.vn' },
    update: {},
    create: {
      email: 'customer@brewlite.vn',
      passwordHash,
      fullName: 'Khách Hàng Mẫu',
      loyaltyPoints: 50,
    },
  });
  console.log(`👤 Tài khoản mẫu: ${demoUser.email}`);

  const staff = await prisma.user.upsert({
    where: { email: 'barista@brewlite.vn' },
    update: { role: Role.STAFF },
    create: {
      email: 'barista@brewlite.vn',
      passwordHash,
      fullName: 'Barista Quầy 1',
      role: Role.STAFF,
    },
  });
  console.log(`🧑‍🍳 Tài khoản nhân viên quầy: ${staff.email}`);

  // 2. Mã khuyến mãi
  await prisma.promotion.upsert({
    where: { code: 'BREW10' },
    update: {},
    create: {
      code: 'BREW10',
      description: 'Giảm 10% tối đa 30.000đ cho đơn từ 50.000đ',
      discountPercent: 10,
      maxDiscount: 30000,
      minOrderValue: 50000,
    },
  });
  await prisma.promotion.upsert({
    where: { code: 'BREWNEW' },
    update: {},
    create: {
      code: 'BREWNEW',
      description: 'Giảm trực tiếp 15.000đ cho khách hàng mới',
      discountPercent: 0,
      maxDiscount: 15000,
      minOrderValue: 0,
    },
  });

  // 3. Thực đơn
  for (const prod of INITIAL_PRODUCTS) {
    const data = {
      name: prod.name,
      category: prod.category,
      price: prod.price,
      imageUrl: prod.imageUrl,
      description: prod.description,
      sizeOptions: prod.sizeOptions,
      toppingOptions: prod.toppingOptions,
    };
    await prisma.product.upsert({
      where: { id: prod.id },
      update: resetStock ? { ...data, stock: prod.stock, version: 0 } : data,
      create: { id: prod.id, ...data, stock: prod.stock },
    });
  }
  console.log(`☕ Đã seed ${INITIAL_PRODUCTS.length} sản phẩm thực đơn thành công!`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  console.log('🌱 Bắt đầu gieo dữ liệu mẫu (Seeding BrewLite DB)...');
  seedDatabase(prisma)
    .catch((e) => {
      console.error('❌ Lỗi khi seed dữ liệu:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
