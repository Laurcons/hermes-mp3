export interface ChatMessageEvent {
  id: string;
  sessionId: string;
  session: {
    _id: string;
    nickname: string;
    isAdmin: boolean;
  };
  text: string;
}
