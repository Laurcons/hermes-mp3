import {
  BaseWsExceptionFilter,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Location } from 'src/types/location';
import { SocketData, UserSocket } from 'src/types/socket-io';
import AbstractGateway from './abstract-gateway';
import { Subscription } from 'rxjs';
import { ChatRoom, Session } from '@prisma/client';
import { Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/lib/filters/ws-exception.filter';
import { WsAppException, errors } from 'src/lib/errors';

@WebSocketGateway({
  path: '/user',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
@UseFilters(WsExceptionsFilter)
export default class UserGateway extends AbstractGateway {
  constructor(
    private sessionService: SessionService,
    private chatService: ChatService,
    private locationService: LocationService,
  ) {
    super();
  }

  async attachSessionToSocket(client: UserSocket): Promise<Session> {
    const { token } = client.handshake.auth;
    const wsId = client.id;
    return await this.sessionService.authSession(token, wsId);
  }

  configureSubscriptions(client: UserSocket): Subscription[] {
    return [
      this.chatService.onMessage$.subscribe((msg) => {
        client.emit('chat-message', msg);
      }),
      this.sessionService.locationTrackingChange$.subscribe((msg) => {
        if (client.data.sessionId === msg.id)
          client.emit('location-tracking', msg.isTrackingLocation);
      }),
      this.sessionService.nicknameChanged$.subscribe((ev) => {
        if (client.data.sessionId === ev.sessionId)
          client.emit('nickname', ev.nickname);
      }),
    ];
  }

  async handleConnection(client: UserSocket) {
    super.handleConnection(client);
    const sess = await this.sessionService.findById(client.data.sessionId);
    client.emit('location-tracking', sess.isTrackingLocation);
    const chats = await this.chatService.getLast50ChatEvents(
      ChatRoom.participants,
    );
    for (const chat of chats) {
      client.emit('chat-message', chat);
    }
    const nick = sess.nickname;
    client.emit('nickname', nick);
  }

  handleDisconnect(
    client: Socket<unknown, unknown, unknown, SocketData>,
  ): void {
    super.handleDisconnect(client);
    this.sessionService.markAsInactive(client.data.sessionId);
  }

  @SubscribeMessage('set-nickname')
  async updateNickname(socket: UserSocket, nickname: string) {
    await this.sessionService.updateNickname(socket.data.sessionId, nickname);
    return 'ok';
  }

  @SubscribeMessage('send-chat-message')
  async sendMessage(socket: UserSocket, text: string) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    await this.chatService.sendMessage(session, text);
    return 'ok';
  }

  @SubscribeMessage('location')
  async trackLocation(socket: UserSocket, pos: Location) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    await this.locationService.trackLocation(session, pos);
    return 'ok';
  }

  @SubscribeMessage('set-location-tracking')
  async setLocationTracking(socket: UserSocket, isTracking: boolean) {
    await this.sessionService.setIsTracking(socket.data.sessionId, isTracking);
    return 'ok';
  }
}
