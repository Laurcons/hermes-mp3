import {
  BaseWsExceptionFilter,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Location } from 'src/types/location';
import { UserSocket } from 'src/types/socket-io';
import AbstractGateway from './abstract-gateway';
import { Subscription } from 'rxjs';
import { Session } from '@prisma/client';

@WebSocketGateway({
  path: '/user',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
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
    ];
  }

  async handleConnection(client: UserSocket) {
    super.handleConnection(client);
    const sess = await this.sessionService.findById(client.data.sessionId);
    client.emit('location-tracking', sess.isTrackingLocation);
  }

  @SubscribeMessage('update-nickname')
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
    this.locationService.trackLocation(session, pos);
    return 'ok';
  }

  @SubscribeMessage('set-location-tracking')
  async setLocationTracking(socket: UserSocket, isTracking: boolean) {
    await this.sessionService.setIsTracking(socket.data.sessionId, isTracking);
    return 'ok';
  }
}
