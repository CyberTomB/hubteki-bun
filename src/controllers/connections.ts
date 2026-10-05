import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../models/websocket";

class ConnectionManager {
  private clients: Map<string, ServerWebSocket<WebSocketData>> = new Map();

  private generateId(): string {
    return crypto.randomUUID();
  }

  addClient(ws: ServerWebSocket<WebSocketData>): string {
    const id = ws.data.clientId;
    this.clients.set(id, ws);
    console.log(`Client ${id} connected. Total clients: ${this.clients.size}`);
    return id;
  }

  removeClient(id: string): void {
    this.clients.delete(id);
    console.log(
      `Client ${id} disconnected. Total clients: ${this.clients.size}`,
    );
  }

  getClient(id: string): ServerWebSocket<WebSocketData> | undefined {
    return this.clients.get(id);
  }

  getAllClients(): ServerWebSocket<WebSocketData>[] {
    return Array.from(this.clients.values());
  }

  getClientCount(): number {
    return this.clients.size;
  }

  broadcast(message: string, excludeId?: string): void {
    for (const [id, client] of this.clients) {
      if (id !== excludeId && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

export const connectionManager = new ConnectionManager();
