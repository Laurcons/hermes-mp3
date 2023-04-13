import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { Subject } from 'rxjs';
import { ChatMessage } from 'src/models/chatMessage';
import { ChatMessageEvent } from './chat.events';
import { Session } from 'src/models/session';

@Injectable()
export default class ChatService {
  private onMessageSub = new Subject<ChatMessageEvent>();
  onMessage$ = this.onMessageSub.asObservable();

  constructor(
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
  ) {}

  async sendMessage(session: Session, text: string) {
    if (!session.nickname && !session.isAdmin)
      throw new WsException('Nickname not set');
    const msg = await this.chatMessageModel.create({
      session: session._id,
      text,
    });
    this.onMessageSub.next({
      _id: msg._id.toString(),
      text: msg.text,
      sessionId: msg.session.toString(),
      session: {
        _id: session._id.toString(),
        nickname: session.nickname,
        isAdmin: !!session.isAdmin,
      },
    });
  }
}
