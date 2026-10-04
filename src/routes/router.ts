import type { BunRequest } from "bun";
import { jsonResponse } from "../utils/jsonHelper";
import { login, refresh, register } from "./login";

export default async function handleRequest(
  request: BunRequest,
): Promise<Response> {
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
        console.log("[ROUTER]: login endpoint");
        return await login(request);
      }

      case "/refresh": {
        console.log("[ROUTER] refreshing: ");
        const ref = await refresh(request);
        console.log("[ROUTER] returning: ", ref);
        return ref;
        return await refresh(request);
      }

      default: {
        return jsonResponse(
          {
            error: `Unable to find the resource located at ${request.destination}`,
          },
          404,
        );
      }
    }
  } catch (error) {
    console.error("Request error", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
