import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Subscription } from 'rxjs';
import { Socket } from 'socket.io';
import { Session } from 'src/models/session';
import { CustomServer } from 'src/types/socket-io';

export default abstract class AbstractGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  abstract attachSessionToSocket(client: Socket): Session | Promise<Session>;
  abstract configureSubscriptions(client: Socket): Subscription[];

  handleConnection(client: Socket) {
    Logger.log(`Socket from ${client.client.conn.remoteAddress}`);
  }

  handleDisconnect(client: Socket) {
    client.data.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  afterInit(server: CustomServer) {
    server.use(async (client, next) => {
      const session = await this.attachSessionToSocket(client);
      const subscriptions = this.configureSubscriptions(client);
      client.data = {
        sessionId: session._id,
        subscriptions,
      };
      next();
    });
  }
}
