import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';

const coffee = {
  id: 'prod_cf_01',
  name: 'Cà Phê Sữa Đá Sài Gòn',
  category: 'COFFEE',
  price: 35000,
  imageUrl: 'https://example.com/cf.jpg',
  description: 'Robusta',
  stock: 50,
  version: 0,
  isActive: true,
  sizeOptions: [{ size: 'S', extraPrice: 0 }],
  toppingOptions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// UT-T04: ProductsService (FR-01, FR-02, NFR-04)
describe('UT-T04 ProductsService', () => {
  let service: ProductsService;
  const prisma = {
    product: { findMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('chỉ lấy sản phẩm đang mở bán', async () => {
      prisma.product.findMany.mockResolvedValue([coffee]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('lọc theo category và từ khóa tìm kiếm', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.findAll('coffee', ' sữa đá ');
      const { where } = prisma.product.findMany.mock.calls[0][0];
      expect(where.category).toBe('COFFEE');
      expect(where.OR[0].name).toEqual({ contains: 'sữa đá', mode: 'insensitive' });
    });

    it('category = ALL thì không lọc', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.findAll('ALL');
      expect(prisma.product.findMany.mock.calls[0][0].where.category).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('trả về sản phẩm khi ID tồn tại', async () => {
      prisma.product.findUnique.mockResolvedValue(coffee);
      await expect(service.findById('prod_cf_01')).resolves.toMatchObject({ id: 'prod_cf_01' });
    });

    it('ném NotFoundException khi ID không tồn tại', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deductStockWithOptimisticLock', () => {
    const tx = prisma as any;

    it('cập nhật với điều kiện version + tồn kho', async () => {
      prisma.product.findUnique.mockResolvedValue(coffee);
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      await service.deductStockWithOptimisticLock(tx, 'prod_cf_01', 2);
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'prod_cf_01', version: 0, stock: { gte: 2 } },
        data: { stock: { decrement: 2 }, version: { increment: 1 } },
      });
    });

    it('thử lại khi xung đột version, đọc version mới', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce(coffee)
        .mockResolvedValueOnce({ ...coffee, version: 1, stock: 49 });
      prisma.product.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
      await service.deductStockWithOptimisticLock(tx, 'prod_cf_01', 1);
      expect(prisma.product.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.product.updateMany.mock.calls[1][0].where.version).toBe(1);
    });

    it('ném ConflictException khi xung đột liên tục', async () => {
      prisma.product.findUnique.mockResolvedValue(coffee);
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.deductStockWithOptimisticLock(tx, 'prod_cf_01', 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('ném ConflictException khi không đủ tồn kho', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...coffee, stock: 1 });
      await expect(service.deductStockWithOptimisticLock(tx, 'prod_cf_01', 5)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.product.updateMany).not.toHaveBeenCalled();
    });
  });
});
