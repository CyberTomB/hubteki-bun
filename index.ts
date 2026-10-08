import mongoose from "mongoose";
import { jsonResponse } from "./src/utils/jsonHelper";
import BunRequest from "bun";
import { login, logout, refresh, register } from "./src/routes/login";
import { authMiddleware, withAuth } from "./src/middleware/auth";
import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./src/models/socketEvents";
import { sessionStore } from "./src/utils/sessionStore";

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

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>();

const engine = new Engine({
  path: "/socket.io/",
  cors: {
    origin: "http://localhost:5173",
    allowedHeaders: ["Authorization"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.bind(engine);

io.use((socket, next) => {
  console.log("[SOCKET] checking for user: ", socket.handshake.auth);

  const username = socket.handshake.auth.username;

  if (!username) {
    return next(new Error("INVALID USERNAME"));
  }

  const sessionId = socket.handshake.auth.sessionId;
  if (sessionId) {
    const session = sessionStore.findSession(sessionId);
    if (session) {
      socket.data.sessionId = sessionId;
      // socket.userId = session.userId;
      socket.data.username = session.username;
      return next();
    }
  }

  socket.data.sessionId = crypto.randomUUID();
  socket.data.username = username;
  next();
});

io.on("connection", (socket) => {
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userId: id,
      username: socket.data.username,
    });
  }

  socket.emit("session", {
    sessionId: socket.data.sessionId,
    username: socket.data.username,
  });

  socket.emit("users", users);

  socket.broadcast.emit("userConnected", {
    userId: socket.id,
    username: socket.data.username,
  });

  socket.on("disconnect", () => {
    console.log("[socket] disconnected");
    socket.emit("userDisconnected", {
      userId: socket.id,
      username: socket.data.username,
    });
  });
});

const server = Bun.serve({
  port: 3000,
  routes: {
    "/login": {
      OPTIONS: () => jsonResponse({}, 204),
      POST: async (req) => {
        return await login(req);
      },
    },
    "/register": {
      OPTIONS: () => jsonResponse({}, 204),
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
  ...engine.handler(),
});

await main();
console.log(`[Serer] Listening on ${server.url}`);
