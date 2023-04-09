import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Subject } from 'rxjs';
import { Location } from 'src/types/location';
import { LocationEvent } from 'src/types/locationEvent';
import { Session } from 'src/types/session';

@Injectable()
export default class LocationService {
  private locationEvents: LocationEvent[] = [];

  private locationFeedSub = new Subject<LocationEvent>();
  locationFeed$ = this.locationFeedSub.asObservable();

  constructor() {}

  trackLocation(session: Session, { lat, lon, acc }: Location) {
    if (!session.isTrackingLocation) {
      throw new WsException(
        'Refusing to track location if tracking is not activated for the session',
      );
    }
    const loc: LocationEvent = {
      _id: randomUUID(),
      lat,
      lon,
      acc,
      sessionId: session._id,
      timestamp: new Date(),
    };
    this.locationEvents.push(loc);
    this.locationFeedSub.next(loc);
    return loc;
  }

  allLocations() {
    return this.locationEvents;
  }
}
