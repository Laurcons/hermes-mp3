export class Session {
  _id: string;
  wsId?: string;
  token: string;
  isAdmin: boolean;
  isTrackingLocation?: boolean;
  nickname?: string;
}
