import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { AppJwtPayload } from '../types/jwt-payload';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly configService: ConfigService) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    const secret = this.configService.get('jwt.secret');
    const decoded = jwt.verify(token, secret) as AppJwtPayload;

    if (!decoded) {
      throw new WsException('Invalid token');
    }

    client.data.user = decoded;

    return true;
  }

  private extractToken(client: Socket): string | null {
    if (client.handshake.auth.token) {
      this.logger.log('Token found in auth object');
      return client.handshake.auth.token;
    }

    if (client.handshake.headers.authorization) {
      this.logger.log('Token found in headers');
      return client.handshake.headers.authorization;
    }

    return null;
  }
}
