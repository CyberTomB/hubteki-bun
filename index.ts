import mongoose from "mongoose";
import { jsonResponse } from "./src/utils/jsonHelper";
import BunRequest from "bun";
import { login, logout, refresh, register } from "./src/routes/login";
import { authMiddleware, withAuth } from "./src/middleware/auth";

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

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": (req) => jsonResponse({ message: "OK" }),
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
  async fetch(req, server) {
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/ws": {
        const token = url.searchParams.get("token");
        console.log("endpoint has token:", token);
        if (!token) {
          return jsonResponse(
            { error: "You must be logged in to open a connection" },
            403,
          );
        }

        req.headers.set("Authorization", `Bearer ${token}`);
        const openConnection = withAuth(async (req) => {
          console.log("opening connection");

          const upgrade = server.upgrade(req);
          if (upgrade) {
            return jsonResponse({ message: "connected" });
          }

          return jsonResponse({ error: "failed to establish connection" });
        });

        return await openConnection(req);
      }
      default: {
        return jsonResponse({ error: "Unable to locate resource" }, 404);
      }
    }
  },
  websocket: {
    message(ws, message) {}, // a message is received
    open(ws) {
      ws.send("connected");
    }, // a socket is opened
    close(ws, code, message) {}, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
  },
});

await main();
console.log(`[Serer] Listening on ${server.url}`);
