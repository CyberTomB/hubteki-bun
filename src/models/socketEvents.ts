import type { DefaultEventsMap } from "socket.io";
import type { UserData } from "./user";

interface SocketUser {
  connectionId: string;
  username: string;
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
  username: string;
  connectionId: string;
}
