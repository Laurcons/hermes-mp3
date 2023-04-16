import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Subject } from 'rxjs';
import { ChatMessageEvent } from './chat.events';
import PrismaService from './prisma.service';
import { Session } from '@prisma/client';

@Injectable()
export default class ChatService {
  private onMessageSub = new Subject<ChatMessageEvent>();
  onMessage$ = this.onMessageSub.asObservable();

  constructor(private prisma: PrismaService) {}

  async sendMessage(session: Session, text: string) {
    if (!session.nickname && session.role === 'volunteer')
      throw new WsException('Nickname not set');
    const msg = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        isParticipant: session.role === 'participant',
        room: 'participants',
        text,
      },
    });
    this.onMessageSub.next({
      id: msg.id,
      text: msg.text,
      sessionId: session.id,
      session: {
        _id: session.id,
        nickname: session.nickname,
        isAdmin: session.role === 'admin',
      },
    });
  }
}
