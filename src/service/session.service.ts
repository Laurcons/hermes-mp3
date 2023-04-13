import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WsException } from '@nestjs/websockets';
import { randomBytes, randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';
import { Subject } from 'rxjs';
import { Session } from 'src/models/session';

@Injectable()
export class SessionService {
  private locationTrackingChangeSub = new Subject<
    Pick<Session, '_id' | 'isTrackingLocation'>
  >();
  locationTrackingChange$ = this.locationTrackingChangeSub.asObservable();

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async createUserSession() {
    const token = randomBytes(256).toString('hex');
    const sess = await this.sessionModel.create({
      isAdmin: false,
      token,
    });
    return sess;
  }

  async createAdminSession(username: string, password: string) {
    if (!(username === 'laur' && password === 'laur'))
      throw new HttpException('Invalid credentials', 401);
    const token = randomBytes(256).toString('hex');
    const sess = await this.sessionModel.create({
      isAdmin: true,
      token,
    });
    return sess;
  }

  async findById(id: Types.ObjectId | string) {
    id = new Types.ObjectId(id);
    return await this.sessionModel.findById(id);
  }

  async removeSession(id: Types.ObjectId) {
    await this.sessionModel.deleteOne({ _id: id });
  }

  /**
   * Authenticates a session. If successfully authed, returns Session. Otherwise, throws.
   */
  async authSession(
    token: string,
    wsId: string,
    platform: 'admin' | 'user' = 'user',
  ): Promise<Session> {
    const sess = await this.sessionModel.findOne({
      token,
    });
    if (!sess) throw new WsException('Invalid credentials');
    if (!sess.isAdmin && platform === 'admin')
      throw new WsException('Invalid credentials');
    sess.wsId = wsId;
    return sess;
  }

  async updateNickname(id: Types.ObjectId, nickname: string): Promise<Session> {
    const sess = await this.sessionModel.findOneAndUpdate(
      { _id: id },
      { $set: { nickname } },
      { new: true },
    );
    if (!sess) throw new WsException('Invalid session id');
    return sess;
  }

  async getGlobalLocationTrackingPercent() {
    // TODO: calculate this percent
    return 0.69;
  }

  async setIsTracking(id: Types.ObjectId, isTrackingLocation: boolean) {
    const sess = await this.sessionModel.findOneAndUpdate(
      { _id: id },
      { $set: { isTrackingLocation } },
      { new: true },
    );
    this.locationTrackingChangeSub.next({ _id: id, isTrackingLocation });
    return sess;
  }
}
