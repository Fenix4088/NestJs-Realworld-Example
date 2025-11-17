import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AppJwtPayload } from 'src/types/jwt-payload';
import { UserData } from 'src/user/user.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly secret: string;
  private userCache = new Map<number, { user: UserData; expires: number }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.secret = configService.get('jwt.secret');
  }

  extractBearerToken(authHeader: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }

    return authHeader;
  }

  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.secret) as AppJwtPayload;
      return decoded;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  async getUserFromToken(token: string): Promise<UserData> {
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const decoded = this.verifyToken(token);

    const cached = this.userCache.get(decoded.id);
    if (cached && cached.expires > Date.now()) {
      return cached.user;
    }

    const userRO = await this.userService.findById(decoded.id);

    if (!userRO || !userRO.user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    this.userCache.set(decoded.id, {
      user: userRO.user as any,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return userRO.user;
  }

  validateTokenOnly(token: string): AppJwtPayload | null {
    try {
      return this.verifyToken(token);
    } catch {
      return null;
    }
  }
}
