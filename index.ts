import mongoose from "mongoose";
import { jsonResponse } from "./src/utils/jsonHelper";
import BunRequest from "bun";
import { login, logout, refresh, register } from "./src/routes/login";
import { authMiddleware, withAuth } from "./src/middleware/auth";
import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

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

const io = new Server();

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

io.on("connection", (socket) => {
  console.log("[socket] Connected");
  socket.on("disconnect", () => {
    console.log("[socket] disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("[socket]: ", msg);
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
