import { userController } from "../controllers/userController";
import { jsonResponse } from "../utils/jsonHelper";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  getStoredToken,
  revokeToken,
  revokeTokenFamily,
  storeRefreshToken,
} from "../utils/tokenStore";

export async function register(request: Request) {
  try {
    console.log("trying to register: ", request);
    const { email, name, password } = (await request.json()) as {
      email: string;
      name: string;
      password: string;
    };

    if (!email || !password) {
      return jsonResponse({ error: "how tf did you get to this place?" }, 400);
    }

    console.info("building user");
    const res = await userController.createUser({
      email: email,
      name: name,
      password: password,
    });

    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return jsonResponse(
        { error: "There is already an account registered to this email" },
        409,
      );
    }
    console.error(error);

    return jsonResponse(
      { error: "Something failed when trying to register" },
      500,
    );
  }
}

export default async function login(request: Request): Promise<Response> {
  try {
    console.log("login: ", request);
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;
    // RETURN TOKEN PAIR

    const user = await userController.validateCredentials(email, password);

    if (!user) {
      return jsonResponse({ error: "Invalid password or email" }, 401);
    }

    const accessToken = await createAccessToken(user._id, user.email);
    const { token: refreshToken, tokenId } = await createRefreshToken(
      user._id,
      user.email,
    );

    const familyId = crypto.randomUUID();

    const deviceInfo = request.headers.get("User-Agent") || "Unknown";
    storeRefreshToken(tokenId, user._id, familyId, deviceInfo);

    return jsonResponse({
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
    });
  } catch (e) {
    console.log(e);
    return new Response();
  }

  return new Response();
}

export async function refresh(request: Request): Promise<Response> {
  console.log("refresh function fired: ", request);
  try {
    const body = (await request.json()) as { refreshToken: string };
    console.log("contents of request body: ", body);
    const { refreshToken } = body;

    if (!refreshToken) {
      return jsonResponse({ error: "Refresh token required" }, 400);
    }

    const payload = await verifyRefreshToken(refreshToken);

    const storedToken = getStoredToken(payload.jti as string);

    if (!storedToken) {
      return jsonResponse({ error: "Refresh token not found" }, 401);
    }

    if (storedToken.revoked) {
      revokeTokenFamily(storedToken.familyId);
      return jsonResponse(
        { error: "Token reuse detected. Please login again." },
        401,
      );
    }

    revokeToken(payload.jti as string);

    const newAccessToken = await createAccessToken(
      payload.sub as string,
      payload.email as string,
    );
    const { token: newRefreshToken, tokenId: newTokenId } =
      await createRefreshToken(payload.sub as string, payload.email as string);

    storeRefreshToken(
      newTokenId,
      payload.sub as string,
      storedToken.familyId,
      storedToken.deviceInfo,
    );

    return jsonResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
    });
  } catch (error) {
    console.log(error);
    return jsonResponse({ error: "Invalid refresh token" }, 401);
  }
}
