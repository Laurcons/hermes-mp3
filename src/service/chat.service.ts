import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Subject } from 'rxjs';
import { ChatMessage } from 'src/types/chatMessage';
import { Session } from 'src/types/session';

@Injectable()
export default class ChatService {
  messages: ChatMessage[] = [];

  private onMessageSub = new Subject<ChatMessage>();
  onMessage$ = this.onMessageSub.asObservable();

  constructor() {}

  sendMessage(session: Session, text: string) {
    if (!session.nickname && !session.isAdmin)
      throw new WsException('Nickname not set');
    const msg: ChatMessage = {
      _id: randomUUID(),
      sessionId: session._id,
      text,
    };
    this.messages.push(msg);
    this.onMessageSub.next({
      ...msg,
      session,
    });
  }
}
