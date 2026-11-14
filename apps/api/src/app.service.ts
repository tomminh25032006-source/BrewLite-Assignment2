import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Hello! Welcome to BrewLite Cashless Coffee Ordering API',
      status: 'OK',
      health: '/api/health',
    };
  }
}
