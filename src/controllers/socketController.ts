import { Server as Engine } from "@socket.io/bun-engine";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../models/socketEvents";
import { Server } from "socket.io";
import { sessionController } from "./sessionController";
import { CookieMap } from "bun";
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
  if (token) {
    const session = await sessionController.getAuthenticatedSession(token);
    if (session) {
      logger("found session");
      const user = await userController.getUserById(session.userId);
      if (!user) {
        logger("failed to find user");
        throw new Error("Unable to find user");
      }

      socket.data.username = user.name;
      return next();
    }
  }

  throw new Error("Invalid session?");
});

io.on("connection", (socket) => {
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userId: id,
      username: socket.data.username,
      sessionId: socket.data.sessionId,
    });
  }

  socket.join(socket.data.username);

  socket.on("chat", ({ content, to }) => {
    logger(`[SOCKET] chat received: , ${content}, for: ${to}`);
    socket.to(to).to(socket.data.username).emit("chat", {
      content,
      from: socket.data.username,
      to,
    });
  });

  socket.emit("session", {
    sessionId: socket.data.sessionId,
    username: socket.data.username,
  });

  socket.emit("users", users);

  socket.broadcast.emit("userConnected", {
    sessionId: socket.data.sessionId,
    userId: socket.id,
    username: socket.data.username,
  });

  socket.on("disconnect", async () => {
    logger("disconnect");
    socket.broadcast.emit("userDisconnected", {
      userId: socket.id,
      username: socket.data.username,
      sessionId: socket.data.sessionId,
    });
  });
});
