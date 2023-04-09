import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Location } from 'src/types/location';
import { Session } from 'src/types/session';
import { CustomServer, CustomSocket } from 'src/types/ws';

@WebSocketGateway({
  path: '/user',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export default class UserGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  @WebSocketServer()
  server: CustomServer;

  constructor(
    private sessionService: SessionService,
    private chatService: ChatService,
    private locationService: LocationService,
  ) {}

  afterInit() {
    this.server.use((client, next) => {
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

  handleConnection(client: CustomSocket, ...args: any[]) {
    // add listeners
    this.chatService.onMessage$.subscribe((msg) => {
      client.emit('chat-message', msg);
    });
    this.sessionService.locationTrackingChange$.subscribe((change) => {
      if (client.data.session!._id === change._id) {
        client.emit('location-tracking', change.isTrackingLocation);
      }
    });
    client.emit('location-tracking', client.data.session!.isTrackingLocation);
  }

  handleDisconnect(client: CustomSocket) {
    // this.sessionService.removeSession(client.data.session?._id);
  }

  @SubscribeMessage('update-nickname')
  updateNickname(socket: CustomSocket, nickname: string) {
    const sess = this.sessionService.updateNickname(
      socket.data.session._id,
      nickname,
    );
    socket.data.session = sess;
    return 'ok';
  }

  @SubscribeMessage('send-chat-message')
  sendMessage(socket: CustomSocket, text: string) {
    const { session } = socket.data;
    this.chatService.sendMessage(session, text);
    return 'ok';
  }

  @SubscribeMessage('location')
  trackLocation(socket: CustomSocket, pos: Location) {
    const { session } = socket.data;
    this.locationService.trackLocation(session, pos);
    return 'ok';
  }

  @SubscribeMessage('set-location-tracking')
  setLocationTracking(socket: CustomSocket, isTracking: boolean) {
    const { session } = socket.data;
    socket.data.session = this.sessionService.setIsTracking(
      session,
      isTracking,
    );
    return 'ok';
  }
}
