import { ChatRoom, SessionRole } from '@prisma/client';

export interface ChatMessageEvent {
  id: string;
  sessionId: string;
  session: {
    _id: string;
    nickname: string;
    role: SessionRole;
    color: string;
  };
  room: ChatRoom;
  text: string;
}
