import { HttpException, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomBytes, randomUUID } from 'crypto';
import { Subject } from 'rxjs';
import { Session } from 'src/types/session';

@Injectable()
export class SessionService {
  sessions: Session[] = [
    {
      _id: randomUUID(),
      token: 'mama',
      isAdmin: false,
    },
  ];

  private locationTrackingChangeSub = new Subject<
    Pick<Session, '_id' | 'isTrackingLocation'>
  >();
  locationTrackingChange$ = this.locationTrackingChangeSub.asObservable();

  createUserSession() {
    const sess: Session = {
      _id: randomUUID(),
      token: randomBytes(256).toString('hex'),
      isAdmin: false,
    };
    this.sessions.push(sess);
    return sess;
  }

  createAdminSession(username: string, password: string) {
    if (!(username === 'laur' && password === 'laur'))
      throw new HttpException('Invalid credentials', 401);
    const sess: Session = {
      _id: randomUUID(),
      token: randomBytes(256).toString('hex'),
      isAdmin: true,
    };
    this.sessions.push(sess);
    return sess;
  }

  removeSession(id: string) {
    this.sessions = this.sessions.filter((s) => s._id !== id);
  }

  /**
   * Authenticates a session. If successfully authed, returns Session. Otherwise, undefined.
   */
  authSession(
    token: string,
    wsId: string,
    platform: 'admin' | 'user' = 'user',
  ): Session | undefined {
    const sess = this.sessions.find((s) => s.token === token);
    if (!sess) return;
    if (!sess.isAdmin && platform === 'admin') return;
    sess.wsId = wsId;
    return sess;
  }

  updateNickname(id: string, nickname: string): Session {
    const sess = this.sessions.find((s) => s._id === id);
    if (!sess) throw new WsException('Invalid session id');
    sess.nickname = nickname;
    return sess;
  }

  getGlobalLocationTrackingPercent() {
    const all = this.sessions.filter((s) => !s.isAdmin);
    const on = all.filter((s) => s.isTrackingLocation);
    return on.length / all.length;
  }

  setIsTracking(session: Session, isTracking: boolean) {
    session.isTrackingLocation = isTracking;
    const { _id, isTrackingLocation } = session;
    this.locationTrackingChangeSub.next({ _id, isTrackingLocation });
    return session;
  }
}
