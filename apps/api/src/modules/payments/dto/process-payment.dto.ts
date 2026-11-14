import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentMethodDto {
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
  CARD = 'CARD',
}

export class ProcessPaymentDto {
  @IsString({ message: 'orderId không được để trống' })
  @IsNotEmpty()
  orderId: string;

  @IsEnum(PaymentMethodDto, { message: 'Phương thức thanh toán phải là MOMO, VNPAY hoặc CARD' })
  method: PaymentMethodDto;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsBoolean()
  @IsOptional()
  simulateFailure?: boolean; // Cờ mô phỏng lỗi để test luồng PAYMENT_FAILED
}
