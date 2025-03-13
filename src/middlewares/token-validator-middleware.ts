import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

@Injectable()
export class TokenValidator implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  use(req: decodedRequest, res: Response, next: NextFunction) {
    const { headers } = req;
    const authorizationHeader = headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [bearer, token] = authorizationHeader.split(' ');

    console.log('bearer', { bearer, token });

    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }
    const secret = this.configService.get<string>('JWT_SECRET') || ''; // Get JWT_SECRET from environment

    try {
      const decodedToken = this.jwtService.verify(token, { secret });
      req.user = decodedToken;
      // You can access the decoded token properties if needed
      // For example: const userId = decodedToken.sub;
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
