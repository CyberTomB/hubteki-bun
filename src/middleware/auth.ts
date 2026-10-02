import type { TokenPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

function jsonResponse(data: object, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
