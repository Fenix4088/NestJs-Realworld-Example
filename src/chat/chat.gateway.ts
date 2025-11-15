import {
      WebSocketGateway,
      WebSocketServer,
      SubscribeMessage,
      MessageBody,
      ConnectedSocket,
      OnGatewayConnection,
      OnGatewayDisconnect,
      OnGatewayInit,
    } from '@nestjs/websockets';
    import { Server, Socket } from 'socket.io';
    import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { WsUser } from '../decorators/ws-user.decorator';
import { AppJwtPayload } from '../types/jwt-payload';

@UseGuards(WsJwtGuard)  
@WebSocketGateway({
      cors: {
            origin: '*', // allow all origins, change in production
      }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

      @WebSocketServer()
      server: Server;

      private logger: Logger = new Logger("ChatGateway");


      handleConnection(client: Socket) {
            this.logger.log(`🔌 Client connected: ${client.id}`);


            client.emit("welcome", {
                  message: "Welcome to the chat!",
                  clientId: client.id,
            });

            client.broadcast.emit("user-joined", {
                  clientId: client.id,
                  timestamp: new Date(),
            });

            this.server.emit('user-left', {
                  clientId: client.id,
                  timestamp: new Date(),
            });
      }
      handleDisconnect(client: any) {
            this.logger.log(`🔌 Client disconnected: ${client.id}`);
      }
      afterInit(server: any) {
            this.logger.log('🚀 WebSocket Gateway initialized');
      }


      @SubscribeMessage('message')
      handleMessage(
            @MessageBody() data: { text: string },
            @ConnectedSocket() client: Socket,
            @WsUser() user: AppJwtPayload
      ) {
            this.logger.log(`💬 The message from ${client.id}: ${data.text}`);

            this.server.emit("message", {
                  clientId: client.id,
                  username: user.username,
                  text: data.text,
                  timestamp: new Date(),
            });

            return {
                  success: true,
                  messageId: Date.now(),
            }
      }


      @SubscribeMessage('typing')
      handleTyping(
            @ConnectedSocket() client: Socket,
            @WsUser() user: AppJwtPayload
      ) {
            client.broadcast.emit("user-typing", {
                  clientId: client.id,
                  username: user.username,
            })
      }
}