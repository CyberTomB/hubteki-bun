import type { DefaultEventsMap } from "socket.io";
import type { UserData } from "./user";

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
}

export interface ClientToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {
  sessionId: string;
  username: string;
}
