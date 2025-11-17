import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsUser } from '../decorators/ws-user.decorator';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { AppJwtPayload } from '../types/jwt-payload';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: '*', // allow all origins, change in production
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private connectedUsersCount = 0;

  private userSocketCache = new Map<number, Set<string>>();

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = this.extractTokenFromSocket(socket);
        if (!token) {
          this.logger.error(`❌ No token for socket ${socket.id}`);
          return next(new Error('Authentication error: No token provided'));
        }

        const user = await this.authService.validateTokenOnly(token);

        if (!user) {
          this.logger.error(`❌ Invalid token for socket ${socket.id}`);
          return next(new Error('Authentication error: Invalid token'));
        }

        socket.data.user = {
          username: user.username,
          email: user.email,
          id: user.id,
        };

        this.logger.log(`✅ Socket ${socket.id} authenticated as ${socket.data.user.username}`);
        next();
      } catch (error) {
        this.logger.error(`❌ Authentication error for socket ${socket.id}: ${error.message}`);
        return next(new Error('Authentication error: ' + error.message));
      }
    });
    this.logger.log('🚀 WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);

    const user: AppJwtPayload = client.data.user;

    if (!user) {
      this.logger.error(`❌ No user for socket ${client.id}`);
      client.disconnect();
      return;
    }

    const cachedUserSockets = this.userSocketCache.get(user.id);
    const isFirstConnection = !this.userSocketCache?.has(user.id);

    client.emit('welcome', {
      message: 'Welcome to the chat!',
      clientId: client.id,
    });

    if (!isFirstConnection) {
      cachedUserSockets.add(client.id);
      return;
    }

    this.userSocketCache.set(user.id, new Set([client.id]));

    this.connectedUsersCount++;

    client.broadcast.emit('user-joined', {
      clientId: client.id,
      timestamp: new Date(),
    });

    this.server.emit('user-count', {
      count: this.connectedUsersCount,
    });
  }
  handleDisconnect(client: Socket) {
    const user: AppJwtPayload = client.data.user;

    if (!user) {
      this.logger.error(`❌ No user for socket ${client.id}`);
      return;
    }
    this.logger.log(`🔌 Client disconnected: ${client.id}`);

    const cachedUserSockets = this.userSocketCache.get(user.id);
    const isUserHasOnlyOneSocket = cachedUserSockets.size === 1;

    if (isUserHasOnlyOneSocket) {
      this.connectedUsersCount--;
      this.userSocketCache.delete(user.id);

      this.server.emit('user-left', {
        clientId: client.id,
        timestamp: new Date(),
      });

      this.server.emit('user-count', {
        count: this.connectedUsersCount,
      });

      return;
    }

    this.userSocketCache.get(user.id).delete(client.id);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { text: string },
    @ConnectedSocket() client: Socket,
    @WsUser() user: AppJwtPayload,
  ) {
    this.logger.log(`💬 The message from ${client.id}: ${data.text}`);

    this.server.emit('message', {
      clientId: client.id,
      userId: user.id,
      username: user.username,
      text: data.text,
      timestamp: new Date(),
    });

    return {
      success: true,
      messageId: Date.now(),
    };
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @WsUser() user: AppJwtPayload) {
    client.broadcast.emit('user-typing', {
      clientId: client.id,
      username: user.username,
      userId: user.id,
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
    @WsUser() user: AppJwtPayload,
  ) {
    client.join(data.roomId);

    this.logger.log(`🔗 User ${user.id} joined room ${data.roomId}`);

    this.server.to(data.roomId).emit('room-message', {
      type: 'system',
      text: `${user.username} joined the room`,
      roomId: data.roomId,
    });

    return {
      success: true,
      message: 'You have joined the room',
      roomId: data.roomId,
    };
  }

  @SubscribeMessage('room-message')
  handleRoomMessage(
    @MessageBody() data: { roomId: string; text: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`💬 Сообщение в комнате ${data.roomId}: ${data.text}`);

    // Отправить только в эту комнату
    this.server.to(data.roomId).emit('room-message', {
      type: 'message',
      clientId: client.id,
      username: data.username,
      text: data.text,
      roomId: data.roomId,
      timestamp: new Date(),
    });
  }

  private extractTokenFromSocket(socket: Socket): string | null {
    // 1. Auth object
    if (socket.handshake.auth?.token) {
      return this.authService.extractBearerToken(socket.handshake.auth.token);
    }

    // 2. Query параметр
    if (socket.handshake.query?.token) {
      return this.authService.extractBearerToken(socket.handshake.query.token as string);
    }

    // 3. Headers
    if (socket.handshake.headers?.authorization) {
      return this.authService.extractBearerToken(socket.handshake.headers.authorization);
    }

    return null;
  }
}
