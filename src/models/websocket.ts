export interface WebSocketData {
  clientId: string;
  userId?: string;
  username?: string;
  connectedAt: Date;
  rooms: Set<string>;
}
