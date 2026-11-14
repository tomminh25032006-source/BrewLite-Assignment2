import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  processPayment(
    @Request() req: { user: AuthUser },
    @Body() dto: ProcessPaymentDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
  ) {
    return this.paymentsService.processPayment(dto, req.user.userId, idempotencyKeyHeader);
  }
}
