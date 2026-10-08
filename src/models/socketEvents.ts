interface SocketUser {
  userId: string;
  username: string;
  sessionId?: string;
}

export interface ServerToClientEvents {
  users: (users: Array<SocketUser>) => void;
  userConnected: (user: SocketUser) => void;
  userDisconnected: (user: SocketUser) => void;
  session: (data: { sessionId: string; username: string }) => void;
  chat: (data: { content: any; from: string; to: string }) => void;
}

export interface ClientToServerEvents {
  chat: (content: any, to: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  sessionId: string;
  username: string;
  userId: string;
}
