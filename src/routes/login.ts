import { userController } from "../controllers/userController";
import { Token } from "../models/token";
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

export async function login(request: Request): Promise<Response> {
  try {
    console.log("login");
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

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

    const token = new Token({
      tokenId: tokenId,
      userId: user._id,
      familyId: familyId,
      deviceInfo: deviceInfo,
    });

    console.log("saving token in login", token.tokenId);
    await token.save();

    return jsonResponse({
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
    });
  } catch (e) {
    console.log(e);
    return jsonResponse({ error: "Unable to login" }, 400);
  }
}

export async function refresh(request: Request): Promise<Response> {
  console.log("refresh function fired");
  try {
    const body = (await request.json()) as { refreshToken: string };
    const { refreshToken } = body;

    if (!refreshToken) {
      console.info("no refresh token");
      return jsonResponse({ error: "Refresh token required" }, 400);
    }

    console.log("attempting verify token");
    const payload = await verifyRefreshToken(refreshToken);

    const storedToken = getStoredToken(payload.jti as string);

    if (!storedToken) {
      console.info("could not find stored token");
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

    const token = new Token({
      tokenId: newTokenId,
      userId: payload.sub as string,
      familyId: storedToken.familyId,
      deviceInfo: storedToken.deviceInfo,
    });

    console.log("saving token: ", token.tokenId);
    await token.save();

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
