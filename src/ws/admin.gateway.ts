import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Observable, bufferCount, bufferTime, filter, from, tap } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Session } from 'src/types/session';
import { CustomServer, CustomSocket } from 'src/types/ws';

@WebSocketGateway({
  path: '/admin',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export default class AdminGateway
  implements OnGatewayConnection, OnGatewayInit
{
  constructor(
    private sessionService: SessionService,
    private chatService: ChatService,
    private locationService: LocationService,
  ) {}

  afterInit(server: CustomServer) {
    server.use((client, next) => {
      // verify session token
      const { token } = client.handshake.auth;
      const wsId = client.id;
      const sess = this.sessionService.authSession(token, wsId);
      if (!sess) {
        return next({
          name: 'invalid-session',
          message: 'Your session credentials are invalid',
        });
      }
      client.data = { session: sess };
      next();
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    // add listeners
    this.chatService.onMessage$.subscribe((msg) => {
      client.emit('chat-message', msg);
    });
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
      });
    from(this.locationService.allLocations())
      .pipe(bufferCount(10))
      .forEach((loc) => client.emit('locations-update', loc));
    from(this.chatService.messages).forEach((msg) => {
      client.emit('chat-message', {
        ...msg,
        session: this.sessionService.sessions.find(
          (s) => s._id === msg.sessionId,
        ),
      });
    });
  }

  @SubscribeMessage('send-chat-message')
  sendMessage(socket: CustomSocket, text: string) {
    const { session } = socket.data;
    this.chatService.sendMessage(session, text);
    return 'ok';
  }
}
