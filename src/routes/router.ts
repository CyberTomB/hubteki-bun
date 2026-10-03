import { jsonResponse } from "../utils/jsonHelper";
import login, { refresh, register } from "./login";

export default async function handleRequest(
  request: Request,
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
        console.log("login endpoint");
        return login(request);
      }

      case "/refresh": {
        console.log("refreshing: ");
        return await refresh(request);
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
