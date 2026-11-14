import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SizeOption, ToppingOption } from '../orders/order-pricing';

export interface ProductDto extends Omit<Product, 'sizeOptions' | 'toppingOptions'> {
  sizeOptions: SizeOption[];
  toppingOptions: ToppingOption[];
}

export function toProductDto(product: Product): ProductDto {
  return {
    ...product,
    sizeOptions: product.sizeOptions as unknown as SizeOption[],
    toppingOptions: product.toppingOptions as unknown as ToppingOption[],
  };
}

// Số lần thử lại khi xung đột version (Optimistic Locking - ADR-003)
const MAX_LOCK_RETRIES = 5;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, search?: string): Promise<ProductDto[]> {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({ where, orderBy: { id: 'asc' } });
    return products.map(toProductDto);
  }

  async findById(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }
    return toProductDto(product);
  }

  /**
   * Trừ tồn kho có Optimistic Locking: chỉ cập nhật khi version còn khớp và đủ hàng.
   * Phải được gọi bên trong prisma.$transaction để rollback cùng các bước khác.
   */
  async deductStockWithOptimisticLock(
    tx: Prisma.TransactionClient,
    productId: string,
    qty: number,
  ): Promise<void> {
    for (let attempt = 0; attempt < MAX_LOCK_RETRIES; attempt++) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${productId}`);
      }
      if (product.stock < qty) {
        throw new ConflictException(
          `Sản phẩm "${product.name}" không đủ số lượng tồn kho (Còn lại: ${product.stock}, Yêu cầu: ${qty}).`,
        );
      }

      const result = await tx.product.updateMany({
        where: { id: productId, version: product.version, stock: { gte: qty } },
        data: { stock: { decrement: qty }, version: { increment: 1 } },
      });
      if (result.count === 1) {
        return;
      }
    }

    throw new ConflictException(
      'Xung đột phiên bản dữ liệu (Version Conflict). Sản phẩm đã được cập nhật bởi giao dịch khác. Vui lòng thử lại.',
    );
  }
}
