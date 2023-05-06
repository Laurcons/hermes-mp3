import { Session } from '@prisma/client';
import { Location } from 'src/types/location';

export interface LocationEventEvent extends Location {
  sessionId: string;
  session: Pick<Session, 'id' | 'color' | 'role'>;
}
