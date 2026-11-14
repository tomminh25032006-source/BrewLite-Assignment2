import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const base = {
      service: 'BrewLite API',
      version: '1.0.0',
      // Commit của image đang chạy (truyền khi build); pipeline CD dùng để chắc chắn bản mới đã lên
      commit: process.env.GIT_SHA || 'dev',
      timestamp: new Date().toISOString(),
    };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ ...base, status: 'unhealthy', database: 'down' });
    }
    return { ...base, status: 'healthy', database: 'up' };
  }
}
