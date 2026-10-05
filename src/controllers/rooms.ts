import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../models/websocket";

class RoomManager {
  private roomMembers: Map<string, Set<string>> = new Map();

  joinRoom(ws: ServerWebSocket<WebSocketData>, roomName: string): void {
    ws.subscribe(roomName);
    ws.data.rooms.add(roomName);

    if (!this.roomMembers.has(roomName)) {
      this.roomMembers.set(roomName, new Set());
    }

    this.roomMembers.get(roomName)!.add(ws.data.clientId);

    console.log(`Client ${ws.data.clientId} joined room: ${roomName}`);

    ws.publish(
      roomName,
      JSON.stringify({
        type: "user_joined",
        room: roomName,
        userId: ws.data.clientId,
        username: ws.data.username || "Anonymous",
        timestamp: Date.now(),
      }),
    );

    ws.send(
      JSON.stringify({
        type: "room_joined",
        room: roomName,
        memberCount: this.getRoomMemberCount(roomName),
      }),
    );
  }

  leaveRoom(ws: ServerWebSocket<WebSocketData>, roomName: string): void {
    ws.unsubscribe(roomName);
    ws.data.rooms.delete(roomName);

    const members = this.roomMembers.get(roomName);
    if (members) {
      members.delete(ws.data.clientId);
      if (members.size === 0) {
        this.roomMembers.delete(roomName);
      }
    }

    console.log(`Client ${ws.data.clientId} left room: ${roomName}`);

    ws.publish(
      roomName,
      JSON.stringify({
        type: "user_left",
        room: roomName,
        userId: ws.data.clientId,
        username: ws.data.username || "Anonymous",
        timestamp: Date.now(),
      }),
    );
  }

  leaveAllRooms(ws: ServerWebSocket<WebSocketData>): void {
    for (const room of ws.data.rooms) {
      this.leaveRoom(ws, room);
    }
  }

  broadcastToRoom(
    ws: ServerWebSocket<WebSocketData>,
    roomName: string,
    message: string,
    includeSelf: boolean = false,
  ): void {
    if (includeSelf) {
      ws.publish(roomName, message);
      ws.send(message);
    } else {
      ws.publish(roomName, message);
    }
  }

  getClientRooms(clientId: string): string[] {
    const rooms: string[] = [];
    for (const [roomName, members] of this.roomMembers) {
      if (members.has(clientId)) {
        rooms.push(roomName);
      }
    }
    return rooms;
  }

  getRoomMemberCount(roomName: string): number {
    return this.roomMembers.get(roomName)?.size || 0;
  }
}

export const roomManager = new RoomManager();
