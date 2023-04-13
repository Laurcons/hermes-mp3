export interface ChatMessageEvent {
  _id: string;
  sessionId: string;
  session: {
    _id: string;
    nickname: string;
    isAdmin: boolean;
  };
  text: string;
}
