import mongoose from "mongoose";
import register from "./src/routes/login";
import { jsonResponse } from "./src/utils/jsonHelper";

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
  console.log("Disconnected from database");
  await server.stop(true);
  console.log("Server stopped, cleaning up resources");

  process.exit();
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    switch (path) {
      case "/": {
        return jsonResponse({ message: "Hello!" });
      }

      case "/register": {
        return await register(request);
      }

      case "/login": {
        console.log("login endpoint");
        return jsonResponse({ message: "login" });
        // return await verifyRefreshToken(request.accessToken);
      }

      case "/refresh": {
        console.log("refreshing: ", request);
        return jsonResponse({ message: "refresh" });
      }

      default: {
        return jsonResponse({ error: "Could not service this request" }, 500);
      }
    }
  } catch (error) {
    console.error("Request error", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

const server = Bun.serve({
  port: 3000,
  fetch: handleRequest,
});

await main();
console.log(`Listening on ${server.url}`);
