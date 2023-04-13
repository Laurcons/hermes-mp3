import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  Observable,
  Subscription,
  bufferCount,
  bufferTime,
  filter,
  from,
  tap,
} from 'rxjs';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { CustomServer, CustomSocket } from 'src/types/ws';

@WebSocketGateway({
  path: '/admin',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export default class AdminGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private sessionService: SessionService,
    private chatService: ChatService,
    private locationService: LocationService,
  ) {}

  afterInit(server: CustomServer) {
    server.use(async (client, next) => {
      // verify session token
      const { token } = client.handshake.auth;
      const wsId = client.id;
      const sess = await this.sessionService.authSession(token, wsId);
      if (!sess) {
        return next({
          name: 'invalid-session',
          message: 'Your session credentials are invalid',
        });
      }
      const subscriptions: Subscription[] = [
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
            client.emit(
              'global-location-tracking-percent',
              this.sessionService.getGlobalLocationTrackingPercent(),
            );
          }),
      ];
      client.data = { sessionId: sess._id, subscriptions };
      next();
    });
  }

  handleConnection(client: CustomSocket, ...args: any[]) {}

  handleDisconnect(client: any) {
    client.data.subscriptions.forEach((s) => s.unsubscribe());
  }

  @SubscribeMessage('send-chat-message')
  async sendMessage(socket: CustomSocket, text: string) {
    const session = await this.sessionService.findById(socket.data.sessionId);
    this.chatService.sendMessage(session, text);
    return 'ok';
  }
}
