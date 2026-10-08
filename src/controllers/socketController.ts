import { Server as Engine } from "@socket.io/bun-engine";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../models/socketEvents";
import { Server } from "socket.io";
import { sessionStore } from "../utils/sessionStore";

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
    "\n [SOCKET] reaching out to database to get user details ",
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

  const username = socket.handshake.auth.username;

  if (!username) {
    return next(new Error("INVALID USERNAME"));
  }

  socket.data.sessionId = crypto.randomUUID();
  socket.data.username = username;
  console.log("\n [SOCKET][USE] creating session: ", socket.data.sessionId);
  next();
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
    console.log("[SOCKET] chat received: ", content, `for: ${to}`);
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
    console.log("[SOCKET][DISCONNECT] disconnected");
    socket.broadcast.emit("userDisconnected", {
      userId: socket.id,
      username: socket.data.username,
      sessionId: socket.data.sessionId,
    });

    sessionStore.saveSession(socket.data.sessionId, {
      userId: socket.id,
      username: socket.data.username,
    });
  });
});
