import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Subject } from 'rxjs';
import { ChatMessageEvent } from '../types/events/chat.events';
import PrismaService from './prisma.service';
import { ChatRoom, Session } from '@prisma/client';
import { errors } from 'src/lib/errors';

@Injectable()
export default class ChatService {
  private onMessageSub = new Subject<ChatMessageEvent>();
  onMessage$ = this.onMessageSub.asObservable();

  constructor(private prisma: PrismaService) {}

  async sendMessage(session: Session, room: ChatRoom, text: string) {
    if (!session.nickname && session.role !== 'admin')
      throw errors.ws.nicknameNotSet;
    text = text.trim();
    if (text.length === 0) throw errors.ws.invalidChatMessage;
    if (session.role === 'participant' && text.length > 1024)
      throw errors.ws.invalidChatMessage;
    const msg = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        room,
        timestamp: new Date(),
        text,
      },
    });
    this.onMessageSub.next({
      id: msg.id,
      text: msg.text,
      sessionId: session.id,
      room,
      session: {
        _id: session.id,
        nickname: session.nickname,
        role: session.role,
        color: session.color,
      },
    });
  }

  async getLast50ChatEvents(rooms: ChatRoom[]): Promise<ChatMessageEvent[]> {
    const roomsMsgs = await Promise.all(
      rooms.map((room) =>
        this.prisma.chatMessage.findMany({
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
        }),
      ),
    );
    return roomsMsgs
      .map((msgs) =>
        msgs.reverse().map(({ session, ...msg }) => ({
          id: msg.id,
          text: msg.text,
          sessionId: session.id,
          room: msg.room,
          session: {
            _id: session.id,
            nickname: session.nickname,
            role: session.role,
            color: session.color,
          },
        })),
      )
      .flat();
  }
}
