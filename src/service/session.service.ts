import { HttpException, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomBytes } from 'crypto';
import { Subject } from 'rxjs';
import RecaptchaService from './recaptcha.service';
import PrismaService from './prisma.service';
import { Session } from '@prisma/client';

@Injectable()
export class SessionService {
  private locationTrackingChangeSub = new Subject<
    Pick<Session, 'id' | 'isTrackingLocation'>
  >();
  locationTrackingChange$ = this.locationTrackingChangeSub.asObservable();

  constructor(
    private prisma: PrismaService,
    private recaptchaService: RecaptchaService,
  ) {}

  async createUserSession(recaptchaToken: string) {
    await this.recaptchaService.verifyToken(recaptchaToken);
    const token = randomBytes(256).toString('hex');
    const sess = await this.prisma.session.create({
      data: {
        token,
        role: 'participant',
      },
    });
    return sess;
  }

  async createAdminSession(username: string, password: string) {
    if (!(username === 'laur' && password === 'laur'))
      throw new HttpException('Invalid credentials', 401);
    const token = randomBytes(256).toString('hex');
    const sess = await this.prisma.session.create({
      data: {
        token,
        role: 'admin',
      },
    });
    return sess;
  }

  async createVolunteerSession(username: string, password: string) {
    if (!(username === 'volunt' && password === 'volunt'))
      throw new HttpException('Invalid credentials', 401);
    const token = randomBytes(256).toString('hex');
  }

  async findById(id: string) {
    return await this.prisma.session.findUnique({ where: { id } });
  }

  async removeSession(id: string) {
    return await this.prisma.session.delete({ where: { id } });
  }

  /**
   * Authenticates a session. If successfully authed, returns Session. Otherwise, throws.
   */
  async authSession(
    token: string,
    wsId: string,
    platform: 'admin' | 'user' = 'user',
  ): Promise<Session> {
    const sess = await this.prisma.session.findFirst({ where: { token } });
    if (!sess) throw new WsException('Invalid credentials');
    if (sess.role !== 'admin' && platform === 'admin')
      throw new WsException('Invalid credentials');
    sess.wsId = wsId;
    return sess;
  }

  async updateNickname(id: string, nickname: string): Promise<Session> {
    const sess = await this.prisma.session.update({
      where: {
        id,
      },
      data: {
        nickname,
      },
    });
    if (!sess) throw new WsException('Invalid session id');
    return sess;
  }

  async getGlobalLocationTrackingPercent() {
    // TODO: calculate this percent
    return 0.69;
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
}
