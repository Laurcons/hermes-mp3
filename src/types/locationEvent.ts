import { Location } from './location';

export interface LocationEvent extends Location {
  _id: string;
  sessionId: string;
  timestamp: Date;
}
