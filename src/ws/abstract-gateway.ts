import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Subscription } from 'rxjs';
import { Session } from 'src/models/session';
import { CustomServer, CustomSocket } from 'src/types/ws';

export default abstract class AbstractGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  abstract attachSessionToSocket(
    client: CustomSocket,
  ): Session | Promise<Session>;
  abstract configureSubscriptions(client: CustomSocket): Subscription[];

  handleConnection(client: CustomSocket) {
    Logger.log(`Socket from ${client.client.conn.remoteAddress}`);
  }

  handleDisconnect(client: CustomSocket) {
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
