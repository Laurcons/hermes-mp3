import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import ChatService from 'src/service/chat.service';
import LocationService from 'src/service/location.service';
import { SessionService } from 'src/service/session.service';
import { Location } from 'src/types/location';
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
    this.server.use(async (client, next) => {
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
      const subscriptions = [
        this.sessionService.locationTrackingChange$.subscribe((change) => {
          if (client.data.sessionId === change._id) {
            client.emit('location-tracking', change.isTrackingLocation);
          }
        }),
        this.chatService.onMessage$.subscribe((msg) => {
          client.emit('chat-message', msg);
        }),
      ];
      client.data = { sessionId: sess._id, subscriptions };
      next();
    });
  }

  async handleConnection(client: CustomSocket) {
    const sess = await this.sessionService.findById(client.data.sessionId);
    client.emit('location-tracking', sess.isTrackingLocation);
  }

  handleDisconnect(client: CustomSocket) {
    client.data.subscriptions.forEach((s) => s.unsubscribe());
    // this.sessionService.removeSession(client.data.session?._id);
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
