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
  transports: ['polling'],
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
    ];
  }

  async handleConnection(client: VolunteerSocket) {
    super.handleConnection(client);
    this.chatService
      .getLast50ChatEvents(['participants', 'volunteers'])
      .then((evts) => evts.forEach((evt) => client.emit('chat-message', evt)));
    this.sessionService
      .findById(client.data.sessionId)
      .then((sess) => client.emit('user', sess));
  }

  @SubscribeMessage('send-chat-message')
  async sendMessage(socket: VolunteerSocket, [room, text]: [ChatRoom, string]) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    this.chatService.sendMessage(session, room, text);
    return 'ok';
  }
}
