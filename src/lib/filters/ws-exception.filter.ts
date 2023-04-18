import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { WsAppException } from '../errors';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ackCallback = host.getArgByIndex(2);
    const respond = (thing: any) => {
      if (typeof ackCallback === 'function') ackCallback(thing);
      else
        host.switchToWs().getClient<Socket>().emit('un-acked-exception', thing);
    };
    if (exception instanceof WsAppException) {
      return respond({
        status: 'error',
        code: exception.code,
        message: exception.message,
      });
    }
    if (exception instanceof WsException) {
      return respond({
        status: 'error',
        code: 'UnknownError',
        message: exception.message,
      });
    }
    console.log({ exception });
    return respond({
      status: 'error',
      code: 'InternalServerError',
    });
  }
}
