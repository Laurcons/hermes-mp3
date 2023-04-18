import { HttpException, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export class AppException extends HttpException {
  constructor(status: number, public code: string, message: string) {
    super(message, status);
  }
}

export class WsAppException extends WsException {
  constructor(public code: string, public message: string) {
    super({ code, message });
  }
}

export const errors = {
  ws: {
    invalidToken: new WsAppException(
      'InvalidToken',
      'Tokenul de autentificare este invalid',
    ),
  },
  auth: {
    invalidCredentials: new AppException(
      HttpStatus.UNAUTHORIZED,
      'InvalidCredentials',
      'Datele de autentificare sunt incorecte',
    ),
  },
  invalidCaptcha: new AppException(
    HttpStatus.UNAUTHORIZED,
    'InvalidCaptcha',
    'Verificarea anti-roboti a esuat. Te rog incearca din nou.',
  ),
};
