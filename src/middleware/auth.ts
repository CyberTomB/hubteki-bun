import type { BunRequest } from "bun";
import { sessionController } from "../controllers/sessionController";
import { ErrorResponse } from "../models/response";

export interface AuthenticatedRequest extends BunRequest {
  userId?: string;
}

export async function authMiddleware(
  request: AuthenticatedRequest,
): Promise<AuthenticatedRequest | Response> {
  const logger = (msg: string) => {
    console.log(`[authmw] ${msg}`);
  };
  const isProduction = process.env.NODE_ENV === "production";
  const token = request.cookies.get(
    isProduction ? "__Host-session" : "session",
  );

  if (!token) {
    logger("no token");
    throw new Error("no session token found");
  }

  try {
    logger("validating session");
    const session = await sessionController.getAuthenticatedSession(token);

    request.userId = session.userId;

    return request;
  } catch (error) {
    logger("couldn't find session" + error);
    return new ErrorResponse("unable to verify user session", 401);
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
