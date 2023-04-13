import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { Subject } from 'rxjs';
import { LocationEvent } from 'src/models/locationEvent';
import { Session } from 'src/models/session';
import { Location } from 'src/types/location';
import { LocationEventEvent } from './location.events';

@Injectable()
export default class LocationService {
  private locationFeedSub = new Subject<LocationEventEvent>();
  locationFeed$ = this.locationFeedSub.asObservable();

  constructor(
    @InjectModel(LocationEvent.name)
    private locationEventModel: Model<LocationEvent>,
  ) {}

  async trackLocation(session: Session, { lat, lon, acc }: Location) {
    if (!session.isTrackingLocation) {
      throw new WsException(
        'Refusing to track location if tracking is not activated for the session',
      );
    }
    const loc = await this.locationEventModel.create({
      lat,
      lon,
      acc,
      session: session._id,
      timestamp: new Date(),
    });
    this.locationFeedSub.next({
      ...loc.toJSON(),
      sessionId: session._id.toString(),
    });
    return loc;
  }
}
