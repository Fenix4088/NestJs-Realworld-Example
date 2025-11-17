import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export class BaseController {
  constructor(private readonly configService: ConfigService) {}

  protected getUserIdFromToken(authorization) {
    if (!authorization) return null;

    const secret = this.configService.get('jwt.secret');

    const token = authorization.split(' ')[1];
    const decoded: any = jwt.verify(token, secret);
    return decoded.id;
  }
}
