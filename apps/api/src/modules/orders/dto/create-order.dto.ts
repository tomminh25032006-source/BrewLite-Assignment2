import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString({ message: 'productId phải là chuỗi' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId: string;

  @IsIn(['S', 'M', 'L'], { message: 'Kích cỡ đồ uống phải là S, M hoặc L' })
  size: 'S' | 'M' | 'L';

  // Chỉ gửi mã topping; giá topping do backend tra cứu (FR-05)
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  toppingIds?: string[];

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  qty: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ArrayNotEmpty({ message: 'Giỏ hàng trống, không thể tạo đơn hàng' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  promotionCode?: string;
}
