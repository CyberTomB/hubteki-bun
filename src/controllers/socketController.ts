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

io.use((socket, next) => {
  // FIXME - There's a more robust way of handling the user info; I think DB calls are okay here so long as use only gets called on io calls
  console.log(
    socket.handshake,
    "[SOCKET] checking for user and session: ",
    socket.handshake.auth,
  );

  const sessionId = socket.handshake.auth.sessionId;
  if (sessionId) {
    const session = sessionStore.findSession(sessionId);
    if (session) {
      console.log("found session");
      socket.data.sessionId = sessionId;
      // socket.userId = session.userId;
      socket.data.username = session.username;
      return next();
    }
  }

  const username = socket.handshake.auth.userId;

  if (!username) {
    return next(new Error("INVALID USERNAME"));
  }

  socket.data.sessionId = crypto.randomUUID();
  socket.data.username = username;
  console.log("\n [SOCKET][USE] creating session: ", socket.data.sessionId);
  next();
});

io.on("connection", (socket) => {
  socket.on("roomCreate", ({ user }: { user: UserData }) => {
    const success = roomController.create({ user });
    console.log("[SOCKET] " + success);
    return success;
  });
});
