import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Subject } from 'rxjs';
import { Location } from 'src/types/location';
import { LocationEventEvent } from '../types/events/location.events';
import PrismaService from './prisma.service';
import { Session } from '@prisma/client';
import { errors } from 'src/lib/errors';

@Injectable()
export default class LocationService {
  private locationFeedSub = new Subject<LocationEventEvent>();
  locationFeed$ = this.locationFeedSub.asObservable();

  constructor(private prisma: PrismaService) {}

  async trackLocation(session: Session, { lat, lon, acc }: Location) {
    if (!session.isTrackingLocation) {
      throw errors.ws.refusingLocationTrack;
    }
    const loc = await this.prisma.locationEvent.create({
      data: {
        lat,
        lon,
        acc,
        sessionId: session.id,
        timestamp: new Date(),
      },
    });
    this.locationFeedSub.next({
      ...loc,
      sessionId: session.id.toString(),
    });
    return loc;
  }

  async getLast50LocationEvents() {
    return await this.prisma.locationEvent.findMany({
      take: 50,
    });
  }
}
