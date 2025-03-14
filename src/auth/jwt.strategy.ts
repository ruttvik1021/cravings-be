// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument, UserRoles } from '../users/schemas/user.schema';

export type JWT_Payload = {
  userId: string;
  email: string;
  role: UserRoles;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JWT_Payload): Promise<Partial<UserDocument>> {
    return {
      _id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
}
