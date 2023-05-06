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
    nicknameNotSet: new WsAppException(
      'NicknameNotSet',
      'Nu ai setat un pseudonim!',
    ),
    invalidNickname: new WsAppException(
      'InvalidNickname',
      'Pseudonimul tău trebuie să aibă 3-17 caractere.',
    ),
    invalidChatMessage: new WsAppException(
      'InvalidChatMessage',
      'Mesajul tău nu poate fi trimis',
    ),
    refusingLocationTrack: new WsAppException(
      'RefusingLocationTrack',
      'Se refuză recepționarea locației deoarece locația live este oprită',
    ),
  },
  auth: {
    invalidCredentials: new AppException(
      HttpStatus.UNAUTHORIZED,
      'InvalidCredentials',
      'Datele de autentificare sunt incorecte',
    ),
    invalidTeamCode: new AppException(
      HttpStatus.UNAUTHORIZED,
      'InvalidTeamCode',
      'Codul echipei este invalid!',
    ),
  },
  invalidCaptcha: new AppException(
    HttpStatus.UNAUTHORIZED,
    'InvalidCaptcha',
    'Verificarea anti-roboți a eșuat. Te rog incearcă din nou.',
  ),
};
