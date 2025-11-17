import { JwtPayload } from 'jsonwebtoken';

export interface AppJwtPayload extends JwtPayload {
  id: number;
  username: string;
  email: string;
}
