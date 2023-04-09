import { Session } from './session';

export interface ChatMessage {
  _id: string;
  sessionId: string;
  session?: Session;
  text: string;
}
