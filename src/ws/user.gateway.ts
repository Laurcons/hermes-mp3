import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Location } from 'src/types/location';
import { CustomSocket } from 'src/types/ws';
import AbstractGateway from './abstract-gateway';
import { Session } from 'src/models/session';
import { Subscription } from 'rxjs';

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

  async attachSessionToSocket(client: CustomSocket): Promise<Session> {
    const { token } = client.handshake.auth;
    const wsId = client.id;
    return await this.sessionService.authSession(token, wsId);
  }

  configureSubscriptions(client: CustomSocket): Subscription[] {
    return [
      this.sessionService.locationTrackingChange$.subscribe((change) => {
        if (client.data.sessionId === change._id) {
          client.emit('location-tracking', change.isTrackingLocation);
        }
      }),
      this.chatService.onMessage$.subscribe((msg) => {
        client.emit('chat-message', msg);
      }),
    ];
  }

  async handleConnection(client: CustomSocket) {
    super.handleConnection(client);
    const sess = await this.sessionService.findById(client.data.sessionId);
    client.emit('location-tracking', sess.isTrackingLocation);
  }

  @SubscribeMessage('update-nickname')
  async updateNickname(socket: CustomSocket, nickname: string) {
    await this.sessionService.updateNickname(socket.data.sessionId, nickname);
    return 'ok';
  }

  @SubscribeMessage('send-chat-message')
  async sendMessage(socket: CustomSocket, text: string) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    this.chatService.sendMessage(session, text);
    return 'ok';
  }

  @SubscribeMessage('location')
  async trackLocation(socket: CustomSocket, pos: Location) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    this.locationService.trackLocation(session, pos);
    return 'ok';
  }

  @SubscribeMessage('set-location-tracking')
  async setLocationTracking(socket: CustomSocket, isTracking: boolean) {
    await this.sessionService.setIsTracking(socket.data.sessionId, isTracking);
    return 'ok';
  }
}
