import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { AppException } from '../errors';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof AppException) {
      res.status(exception.getStatus()).json({
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
      });
    } else {
      res.status(500).json({
        status: 500,
        code: 'InternalServerError',
        message: 'Ceva a mers prost. Te rog reincearca!',
      });
    }
  }
}
