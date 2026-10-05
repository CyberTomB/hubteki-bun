import mongoose from "mongoose";
import { DEV_HEADERS, jsonResponse } from "./src/utils/jsonHelper";
import BunRequest, { type ServerWebSocket } from "bun";
import { login, logout, refresh, register } from "./src/routes/login";
import type { WebSocketData } from "./src/models/websocket";
import { connectionManager } from "./src/controllers/connections";

async function main() {
  // Connect to database
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING || "");
    console.log("You successfully connected to MongoDB!");
    return mongoose;
  } catch (err) {
    console.dir(err, "shutting down...");
    await shutdown();
  }
}

async function shutdown() {
  await mongoose.connection.close();
  console.log("[shutdown] Disconnected from database");
  await server.stop(true);
  console.log("[shutdown] Server stopped, cleaning up resources");

  process.exit();
}

const server: Bun.Server<WebSocketData> = Bun.serve({
  port: 3000,
  routes: {
    // "/": (req) => {
    //   console.log("base URL trigger", req.url);
    //   return jsonResponse({ message: "OK" });
    // },
    "/login": {
      OPTIONS: () => jsonResponse({}, 204),
      POST: async (req) => {
        return await login(req);
      },
    },
    "/register": {
      POST: async (req) => {
        return await register(req);
      },
    },
    "/refresh": {
      OPTIONS: () => jsonResponse({}, 204),
      POST: async (req) => {
        return await refresh(req);
      },
    },
    "/logout": {
      OPTIONS: () => jsonResponse({}, 204),
      POST: async (req) => {
        return await logout(req);
      },
    },
  },
  websocket: {
    message(ws, message) {
      const text = typeof message === "string" ? message : message.toString();
      console.log(`[${ws.data.clientId}] Received: ${text}`);

      connectionManager.broadcast(
        JSON.stringify({
          type: "message",
          from: ws.data.clientId,
          content: text,
        }),
        ws.data.clientId,
      );
    },
    open: (ws) => {
      console.log("[server] Opening connection...");
      connectionManager.addClient(ws);

      ws.send(
        JSON.stringify({
          type: "connected",
          clientId: ws.data.clientId,
          timestamp: Date.now(),
        }),
      );
    },
    close: (ws) => {
      console.log("Client disconnected");
      connectionManager.removeClient(ws.data.clientId);
    },
  },
  fetch(req, server) {
    console.log("reached endpoint outside of routes");
    const url = new URL(req.url);
    console.log("url request pathname: ", url.pathname);

    if (req.method === "OPTIONS") {
      console.log("handling preflight");
      return jsonResponse({});
    }

    if (url.pathname === "/room") {
      const clientId = crypto.randomUUID();
      const wsData: WebSocketData = {
        clientId,
        connectedAt: new Date(),
        rooms: new Set(),
      };
      const upgrade = server.upgrade(req, {
        data: wsData,
        headers: DEV_HEADERS,
      });

      if (upgrade) {
        console.log("upgrade success");
        return undefined;
      }

      console.log("upgrade failed", server.pendingWebSockets);
    }

    return jsonResponse({ error: "Failed to upgrade to websocket" }, 500);
  },
});

await main();
console.log(`[Serer] Listening on ${server.url}`);
