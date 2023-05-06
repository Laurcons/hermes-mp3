import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Location } from 'src/types/location';
import { UserSocket, VolunteerSocket } from 'src/types/socket-io';
import AbstractGateway from './abstract-gateway';
import { Subscription } from 'rxjs';
import { ChatRoom, Session } from '@prisma/client';

@WebSocketGateway({
  path: '/volunteer',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export default class VolunteerGateway extends AbstractGateway {
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
    ];
  }

  async handleConnection(client: VolunteerSocket) {
    super.handleConnection(client);
    this.chatService
      .getLast50ChatEvents(['participants', 'volunteers'])
      .then((evts) => evts.forEach((evt) => client.emit('chat-message', evt)));
    const sess = await this.sessionService.findById(client.data.sessionId);
    client.emit('user', sess);
    client.emit('location-tracking', sess.isTrackingLocation);
  }

  @SubscribeMessage('send-chat-message')
  async sendMessage(socket: VolunteerSocket, [room, text]: [ChatRoom, string]) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    this.chatService.sendMessage(session, room, text);
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
