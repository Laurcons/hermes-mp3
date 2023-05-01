import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Subscription, bufferTime, filter } from 'rxjs';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { AdminSocket } from 'src/types/socket-io';
import AbstractGateway from './abstract-gateway';
import { ChatRoom, Session } from '@prisma/client';
import StatusService from 'src/service/status.service';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

@WebSocketGateway({
  path: '/admin',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export default class AdminGateway extends AbstractGateway {
  constructor(
    private sessionService: SessionService,
    private chatService: ChatService,
    private locationService: LocationService,
    private statusService: StatusService,
  ) {
    super();
  }

  async attachSessionToSocket(client: AdminSocket): Promise<Session> {
    const { token } = client.handshake.auth;
    const wsId = client.id;
    return await this.sessionService.authSession(token, wsId);
  }

  configureSubscriptions(client: AdminSocket): Subscription[] {
    return [
      this.chatService.onMessage$.subscribe((msg) => {
        client.emit('chat-message', msg);
      }),
      this.locationService.locationFeed$
        .pipe(
          bufferTime(2000),
          filter((batch) => batch.length !== 0),
        )
        .subscribe((locBatch) => {
          client.emit('locations-update', locBatch);
        }),
      this.statusService.status$.subscribe((status) => {
        client.emit('status', status);
      }),
    ];
  }

  handleConnection(client: AdminSocket) {
    this.chatService
      .getLast50ChatEvents(['participants', 'volunteers'])
      .then((evts) => evts.forEach((evt) => client.emit('chat-message', evt)));
    this.locationService
      .getLast50LocationEvents()
      .then((evts) => client.emit('locations-update', evts));
  }

  handleDisconnect(client: AdminSocket): void {
    this.sessionService.markAsInactive(client.data.sessionId);
  }

  @SubscribeMessage('send-chat-message')
  async sendMessage(socket: AdminSocket, [room, text]: [ChatRoom, string]) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    this.chatService.sendMessage(session, room, text);
    return 'ok';
  }
}
