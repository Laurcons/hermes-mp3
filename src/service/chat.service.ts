import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Subject } from 'rxjs';
import { ChatMessageEvent } from './chat.events';
import PrismaService from './prisma.service';
import { ChatRoom, Session } from '@prisma/client';
import { errors } from 'src/lib/errors';

@Injectable()
export default class ChatService {
  private onMessageSub = new Subject<ChatMessageEvent>();
  onMessage$ = this.onMessageSub.asObservable();

  constructor(private prisma: PrismaService) {}

  async sendMessage(session: Session, text: string) {
    if (!session.nickname && session.role === 'participant')
      throw errors.ws.nicknameNotSet;
    const msg = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        isParticipant: session.role === 'participant',
        room: 'participants',
        timestamp: new Date(),
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

  async getLast50ChatEvents(room: ChatRoom): Promise<ChatMessageEvent[]> {
    const msgs = await this.prisma.chatMessage.findMany({
      take: 50,
      where: {
        room,
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        session: true,
      },
    });
    return msgs.reverse().map(({ session, ...msg }) => ({
      id: msg.id,
      text: msg.text,
      sessionId: session.id,
      session: {
        _id: session.id,
        nickname: session.nickname,
        isAdmin: session.role === 'admin',
      },
    }));
  }
}
