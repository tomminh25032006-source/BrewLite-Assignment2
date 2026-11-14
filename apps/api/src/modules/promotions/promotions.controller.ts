import { Controller, Get, Param, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { PromotionsService } from './promotions.service';

export class QuotePromotionQuery {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  subtotal!: number;
}

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // GET /api/promotions/BREW10?subtotal=60000 → số tiền giảm do backend tính
  @Get(':code')
  quote(@Param('code') code: string, @Query() query: QuotePromotionQuery) {
    return this.promotionsService.quote(code, query.subtotal);
  }
}
