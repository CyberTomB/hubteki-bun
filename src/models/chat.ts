export interface ChatUserData {
  clientId: string;
  userId: string;
  username: string;
  connectedAt: Date;
  rooms: Set<string>;
  isTyping: Map<string, boolean>;
}

export type ChatMessage =
  | { type: "join_room"; room: string }
  | { type: "leave_room"; room: string }
  | { type: "chat"; room: string; text: string }
  | { type: "typing"; room: string; isTyping: boolean }
  | { type: "pong" }
  | { type: "get_rooms" };
