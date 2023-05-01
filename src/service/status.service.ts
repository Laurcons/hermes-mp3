import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { Subject } from 'rxjs';
import StatusEvent from 'src/types/events/status.events';

@Injectable()
export default class StatusService {
  private statusSub = new Subject<StatusEvent>();
  status$ = this.statusSub.asObservable();

  constructor(sessionService: SessionService) {
    let isRunning = false;
    setInterval(async () => {
      if (isRunning) return;
      isRunning = true;

      try {
        const [sessions] = await Promise.all([
          sessionService.getStatusReport(),
        ]);
        this.statusSub.next({
          sessions,
        });
      } catch (err: any) {
        console.error(err);
      }

      isRunning = false;
    }, 3000);
  }
}
