import mongoose from "mongoose";
import { jsonResponse } from "./src/utils/jsonHelper";
import handleRequest from "./src/routes/router";

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

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    if (req.method === "OPTIONS") {
      return jsonResponse({}, 204);
    }

    return handleRequest(req);
  },
});

await main();
console.log(`Listening on ${server.url}`);
