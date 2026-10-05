import mongoose from "mongoose";
import { jsonResponse } from "./src/utils/jsonHelper";
import handleRequest from "./src/routes/router";
import BunRequest from "bun";
import { login, refresh, register } from "./src/routes/login";

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
  },
});

await main();
console.log(`[Serer] Listening on ${server.url}`);
