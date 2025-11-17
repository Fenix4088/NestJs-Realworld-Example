import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from './user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeaders = req.headers.authorization;

      if (!authHeaders) {
        throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
      }

      const token = this.authService.extractBearerToken(authHeaders);
      const user = await this.authService.getUserFromToken(token);

      req.user = user;
      next();
    } catch {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }
  }
}
