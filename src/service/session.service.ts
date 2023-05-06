import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Subject } from 'rxjs';
import RecaptchaService from './recaptcha.service';
import PrismaService from './prisma.service';
import { Session } from '@prisma/client';
import { errors } from 'src/lib/errors';
import { NicknameChangedEvent } from 'src/types/events/session.events';
import * as bcrypt from 'bcrypt';
import { matches } from 'class-validator';

@Injectable()
export class SessionService {
  private locationTrackingChangeSub = new Subject<
    Pick<Session, 'id' | 'isTrackingLocation'>
  >();
  locationTrackingChange$ = this.locationTrackingChangeSub.asObservable();
  private nicknameChangedSub = new Subject<NicknameChangedEvent>();
  nicknameChanged$ = this.nicknameChangedSub.asObservable();
  private revokeSessionSub = new Subject<Pick<Session, 'id'>>();
  revokeSession$ = this.revokeSessionSub.asObservable();

  constructor(
    private prisma: PrismaService,
    private recaptchaService: RecaptchaService,
  ) {}

  async createUserSession({
    recaptchaToken,
    ip,
  }: {
    recaptchaToken: string;
    ip: string;
  }) {
    await this.recaptchaService.verifyToken(recaptchaToken);
    const token = randomBytes(256).toString('hex');
    const sess = await this.prisma.session.create({
      data: {
        token,
        role: 'participant',
        // generate random color
        color:
          '#' + Math.round(Math.random() * 0xefffff + 0x100000).toString(16),
        ip,
      },
    });
    return sess;
  }

  async createAdminOrVolunteerSession({
    username,
    password,
    ip,
  }: {
    username: string;
    password: string;
    ip: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw errors.auth.invalidCredentials;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw errors.auth.invalidCredentials;
    const token = randomBytes(256).toString('hex');
    const sess = await this.prisma.session.create({
      data: {
        token,
        role: user.role,
        userId: user.id,
        nickname: user.username,
        ip,
      },
    });
    return sess;
  }

  async findById(id: string) {
    return await this.prisma.session.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async removeSession(id: string) {
    return await this.prisma.session.delete({ where: { id } });
  }

  /**
   * Removes the wsId from a session, effectively saying that it is not active anymore.
   */
  async markAsInactive(id: string) {
    return await this.prisma.session.update({
      where: { id },
      data: { wsId: null },
    });
  }

  /**
   * Authenticates a session. If successfully authed, returns Session. Otherwise, throws.
   */
  async authSession(
    token: string,
    wsId: string,
    platform: 'admin' | 'user' = 'user',
  ): Promise<Session> {
    const sess = await this.prisma.session.update({
      where: { token: token ?? '' },
      data: { wsId },
    });
    if (!sess) throw errors.ws.invalidToken;
    if (sess.role !== 'admin' && platform === 'admin')
      throw errors.ws.invalidToken;
    return sess;
  }

  async updateNickname(id: string, nickname: string): Promise<Session> {
    if (!matches(nickname, /[\S]{3,17}/)) {
      throw errors.ws.invalidNickname;
    }
    const sess = await this.prisma.session.update({
      where: {
        id,
      },
      data: {
        nickname,
      },
    });
    if (!sess) throw errors.ws.invalidToken;
    this.nicknameChangedSub.next({ sessionId: id, nickname });
    return sess;
  }

  async setIsTracking(id: string, isTrackingLocation: boolean) {
    const sess = await this.prisma.session.update({
      where: {
        id,
      },
      data: {
        isTrackingLocation,
      },
    });
    this.locationTrackingChangeSub.next({ id, isTrackingLocation });
    return sess;
  }

  async getStatusReport() {
    const [activeParticipants, activeTrackings] = await Promise.all([
      this.prisma.session.count({
        where: {
          role: 'participant',
          wsId: { not: null },
        },
      }),
      this.prisma.session.count({
        where: {
          role: 'participant',
          isTrackingLocation: true,
          wsId: { not: null },
        },
      }),
    ]);
    return {
      activeParticipants,
      activeTrackings,
    };
  }

  async revokeSession(id: string) {
    const sess = await this.prisma.session.update({
      where: { id },
      data: {
        isRevoked: true,
      },
    });
    this.revokeSessionSub.next({ id });
    return sess;
  }
}
