import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Socket } from "socket.io";
import { AppJwtPayload } from "src/types/jwt-payload";

export const WsUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
      const client = ctx.switchToWs().getClient<Socket>();

      const user = client.data.user;

      return data ? user[data] : user;
});