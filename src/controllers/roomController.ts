import type { BunRequest } from "bun";
import { withAuth, type AuthenticatedRequest } from "../middleware/auth";
import { jsonResponse } from "../utils/jsonHelper";

class RoomController {
  // FIXME - In-mem placeholder

  private rooms: Map<string, string>;

  constructor() {
    this.rooms = new Map();
  }

  // wrap using withAuth middleware?
  public async createRoom(request: Request) {
    // Check if existing user already has a room: error if they do
    const { userId } = (await request.json()) as { userId: string };

    // TODO - set inside try/catch
    // room already exists
    const assignedRoom = this.rooms.get(userId);
    if (assignedRoom) {
      console.warn(`[room controller] Already have a room:  ${assignedRoom}`);
      throw new Error();
    }

    const roomId = crypto.randomUUID();
    this.rooms.set(userId, roomId);

    return jsonResponse({
      message: "Room created!",
      roomId,
    });
  }
}

export const roomController = new RoomController();
