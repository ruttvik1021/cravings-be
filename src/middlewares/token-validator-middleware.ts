import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JWT_Payload } from 'src/auth/jwt.strategy';

@Injectable()
export class TokenValidator implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  use(req: decodedRequest, res: Response, next: NextFunction) {
    // Extract the token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const secret = this.configService.get<string>('JWT_SECRET') || ''; // Get JWT_SECRET from environment

    try {
      // Verify and decode the token
      const decodedToken = this.jwtService.verify(token, { secret });
      req.user = decodedToken as JWT_Payload; // Attach the decoded user to the request object
      next();
    } catch (error) {
      console.error('Token Verification Error:', error.message);
      // Handle token verification failure (e.g., unauthorized access)
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}

type TokenReq = {
  user?: any;
};

export type decodedRequest = TokenReq & Request;
