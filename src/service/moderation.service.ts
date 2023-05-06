import { Injectable } from '@nestjs/common';
import PrismaService from './prisma.service';
import { SessionService } from './session.service';
import ChatService from './chat.service';

@Injectable()
export class ModerationService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
    private chatService: ChatService,
  ) {}

  async getBanIpNicknames(ip: string) {
    return await this.prisma.session
      .findMany({
        where: { ip },
        select: { nickname: true },
      })
      .then((rs) => rs.map((r) => r.nickname));
  }

  async banIp(ip: string) {
    const ban = await this.prisma.ban.create({
      data: {
        type: 'ip',
        value: ip,
      },
    });
    const sessions = await this.prisma.session.findMany({
      where: { ip },
    });
    await Promise.all(
      sessions.map((sess) => this.sessionService.revokeSession(sess.id)),
    );
    return ban;
  }

  async banSession(id: string) {
    const ban = await this.prisma.ban.create({
      data: {
        type: 'session',
        value: id,
      },
    });
    await this.sessionService.revokeSession(id);
    return ban;
  }

  async deleteMessage(id: string) {
    await this.chatService.deleteMessage(id);
  }
}
