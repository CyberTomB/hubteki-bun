import { Server as Engine } from "@socket.io/bun-engine";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../models/socketEvents";
import { Server } from "socket.io";
import { sessionStore } from "../utils/sessionStore";
import { roomController } from "./roomController";
import type { UserData } from "../models/user";

export const engine = new Engine({
  path: "/socket.io/",
  cors: {
    origin: "http://localhost:5173",
    allowedHeaders: ["Authorization"],
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
  // FIXME - There's a more robust way of handling the user info; I think DB calls are okay here so long as use only gets called on io calls
  console.log(
    "[SOCKET] checking for user and session: ",
    socket.handshake.auth,
  );

  const { userId, sessionId } = socket.handshake.auth as {
    userId: string;
    sessionId: string;
  };

  if (sessionId) {
    console.log("[SOCKET][USE] finding session...");
    const session = sessionStore.findSession(sessionId);
    console.log("[SOCKET][USE] found session: ", session);
    if (session) {
      console.log("found session");
      socket.data.sessionId = sessionId;
      return next();
    }
  }

  const username = socket.handshake.auth.userId;

  if (!username) {
    return next(new Error("INVALID USERNAME"));
  }

  const newSessionId = crypto.randomUUID();
  socket.data.sessionId = newSessionId;
  console.log("[SOCKET][USE] creating session: ", socket.data.sessionId);
  sessionStore.saveSession(newSessionId, { userId: userId, username: "Test" });
  next();
});

io.on("connection", (socket) => {
  socket.emit("session", { sessionId: socket.data.sessionId });

  socket.on("roomCreate", ({ user }: { user: UserData }) => {
    const success = roomController.create({ user });
    console.log("[SOCKET] " + success);
    return success;
  });
});
