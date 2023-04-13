import { Location } from 'src/types/location';

export interface LocationEventEvent extends Location {
  sessionId: string;
}
