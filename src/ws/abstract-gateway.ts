import { Logger, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Session } from '@prisma/client';
import { Subscription } from 'rxjs';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { WsExceptionsFilter } from 'src/lib/filters/ws-exception.filter';
import { SocketData } from 'src/types/socket-io';
import { CustomServer } from 'src/types/socket-io';

// @UseFilters(WsExceptionsFilter)
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
      try {
        const session = await this.attachSessionToSocket(client);
        const subscriptions = this.configureSubscriptions(client);
        client.data = {
          sessionId: session.id,
          subscriptions,
        };
      } catch (err: any) {
        const error = new Error(err.message) as ExtendedError;
        error.data = err;
        return next(error);
      }
      next();
    });
  }
}
