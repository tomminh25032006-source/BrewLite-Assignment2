import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/jwt.strategy';

interface AuthRequest {
  user: AuthUser;
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Request() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, dto);
  }

  // Màn hình quầy (KDS) của nhân viên: danh sách toàn bộ đơn
  @Roles(Role.STAFF)
  @Get()
  getAllOrders() {
    return this.ordersService.findAll();
  }

  @Get('me')
  getMyOrders(@Request() req: AuthRequest) {
    return this.ordersService.findUserOrders(req.user.userId);
  }

  // Khách chỉ xem được đơn của mình, nhân viên quầy xem được mọi đơn
  @Get(':id')
  getOrderById(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.ordersService.findForUser(id, req.user);
  }

  // Khách tự hủy đơn chưa thanh toán (luồng ngoại lệ 2 của UC thanh toán)
  @Post(':id/cancel')
  @HttpCode(200)
  cancelOrder(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.ordersService.cancelByCustomer(id, req.user.userId);
  }

  // Nhân viên quầy chuyển trạng thái pha chế theo State Machine
  @Roles(Role.STAFF)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }
}
