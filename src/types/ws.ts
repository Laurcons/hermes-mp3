import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Types } from 'mongoose';
import { Subscription } from 'rxjs';

export type SocketData = {
  sessionId: Types.ObjectId;
  subscriptions: Subscription[];
};

export type CustomServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

export type CustomSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;
