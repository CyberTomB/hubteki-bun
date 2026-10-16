import { Server as Engine } from "@socket.io/bun-engine";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../models/socketEvents";
import { Server } from "socket.io";
import { sessionController } from "./sessionController";
import { CookieMap, randomUUIDv7 } from "bun";
import { userController } from "./userController";

const logger = (msg: string) => {
  console.log(`[socket] ${msg}`);
};

export const engine = new Engine({
  path: "/socket.io/",
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const lobby: Map<string, string> = new Map();

// SECTION io
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>();

io.bind(engine);

io.use(async (socket, next) => {
  const cookies = new CookieMap(socket.request.headers.cookie ?? "");

  const isProduction = process.env.NODE_ENV === "production";
  const token = cookies.get(isProduction ? "__Host-session" : "session");

  logger("checking for session token");
  if (!token) {
    return next(new Error("no token"));
  }

  logger("retrieving session");
  const session = await sessionController.getAuthenticatedSession(token);
  if (!session) {
    return next(new Error("unable to find session"));
  }

  logger("found session, retrieving user");
  const user = await userController.getUserById(session.userId);
  if (!user) {
    logger("failed to find user");
    return next(new Error("unable to find user"));
  }

  socket.data.username = user.name;
  socket.data.connectionId = randomUUIDv7(); //NOTE: This ID is meant to obfuscate and function in place of the session token
  return next();
});

io.on("connection", (socket) => {
  socket.join("lobby");

  lobby.set(socket.data.connectionId, socket.data.username);
  const onlineUsers = Array.from(lobby, ([k, v], index) => {
    return { connectionId: k, username: v };
  });

  socket.emit("users", onlineUsers);

  socket.broadcast.emit("userConnected", {
    connectionId: socket.data.connectionId,
    username: socket.data.username,
  });

  socket.on("disconnect", async () => {
    logger("disconnect " + socket.data.connectionId);
    lobby.delete(socket.data.connectionId);
    socket.broadcast.emit("userDisconnected", {
      connectionId: socket.data.connectionId,
      username: socket.data.username,
    });
  });
});
