import { jsonResponse } from "../utils/jsonHelper";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authMiddleware(
  request: AuthenticatedRequest,
): Promise<AuthenticatedRequest | Response> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return jsonResponse(
      {
        error: "Authorization header missing",
      },
      401,
    );
  }

  if (!authHeader.startsWith("Bearer ")) {
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

    request.user = payload;

    return request;
  } catch (error) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const result = await authMiddleware(request as AuthenticatedRequest);

    if (result instanceof Response) {
      return result;
    }

    return handler(result);
  };
}
