import mongoose from "mongoose";
import { jsonResponse } from "./src/utils/jsonHelper";
import { login, logout, refresh, register } from "./src/routes/login";
import { engine } from "./src/controllers/socketController";
import { roomController } from "./src/controllers/roomController";
import { withAuth } from "./src/middleware/auth";

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
    "/room": {
      OPTIONS: () => jsonResponse({}, 204),
      POST: async (req) => {
        try {
          return await roomController.createRoom(req);
        } catch (e) {
          return jsonResponse(
            {
              error: "Could not create room",
            },
            500,
          );
        }
      },
    },
  },
  ...engine.handler(),
});

await main();
console.log(`[Serer] Listening on ${server.url}`);
