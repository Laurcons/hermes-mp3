import { SessionService } from 'src/service/session.service';

type Unpromised<T> = T extends Promise<infer X> ? X : never;

export default interface StatusEvent {
  sessions: Unpromised<ReturnType<SessionService['getStatusReport']>>;
}
