import type { BunRequest } from "bun";
import { jsonResponse } from "../utils/jsonHelper";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends BunRequest {
  user?: TokenPayload;
}

export async function authMiddleware(
  request: AuthenticatedRequest,
): Promise<AuthenticatedRequest | Response> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return jsonResponse(
      {
        error: "Authorization header missing",
      },
      401,
    );
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.log("token is not bearer");
    return jsonResponse(
      { error: "Invalid authorzation format. User: Bearer <token>" },
      401,
    );
  }

  const token = authHeader.substring(7);

  if (!token) {
    return jsonResponse({ error: "Token missing" }, 401);
  }

  try {
    const payload = await verifyAccessToken(token);

    console.log("received payload: ", payload);

    request.user = payload;

    return request;
  } catch (error) {
    console.log("[auth][verify]", error);
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>,
): (req: BunRequest | Request) => Promise<Response> {
  return async (request: BunRequest | Request): Promise<Response> => {
    const result = await authMiddleware(request as AuthenticatedRequest);

    if (result instanceof Response) {
      return result;
    }

    return handler(result);
  };
}
