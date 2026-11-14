import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  fullName?: string;
  role?: Role;
}

// Thông tin người dùng gắn vào req.user sau khi JwtAuthGuard xác thực token
export interface AuthUser {
  userId: string;
  email: string;
  fullName?: string;
  role: Role;
}

// Secret chỉ lấy từ biến môi trường, không có giá trị mặc định trong mã nguồn
export function requireJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('Thiếu biến môi trường JWT_SECRET');
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(configService),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role ?? Role.CUSTOMER,
    };
  }
}
