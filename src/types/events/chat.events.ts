import { ChatRoom } from '@prisma/client';

export interface ChatMessageEvent {
  id: string;
  sessionId: string;
  session: {
    _id: string;
    nickname: string;
    isAdmin: boolean;
  };
  room: ChatRoom;
  text: string;
}
