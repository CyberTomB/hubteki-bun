import type { UserData } from "../models/user";
import { jsonResponse } from "../utils/jsonHelper";

export interface Room {
  id: string;
  creatorId: string; // maps to a userID
  isPrivate?: boolean;
}

class RoomController {
  // method: create
  public create(data: { user: UserData }): string {
    const { user } = data;
    const roomId = crypto.randomUUID();
    this.rooms.set(roomId, {
      id: roomId,
      creatorId: user.id,
      isPrivate: false,
    });

    console.log(`[ROOMS] new room request from ${user.email}: added ${roomId}`);
    return `[SERVER][ROOMS] created room ${roomId}`;
  }

  // method: join
  // method: delete

  rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }
}

export const roomController = new RoomController();
