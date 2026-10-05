import type { BunRequest } from "bun";
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
  revokeAllUserTokens,
  revokeToken,
  revokeTokenFamily,
  storeRefreshToken,
} from "../utils/tokenStore";
import type { UserData } from "../models/user";

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

export async function login(request: BunRequest): Promise<Response> {
  try {
    console.log("login");
    // SECTION - 2. Receive and validation Credentials
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

    const user = await userController.validateCredentials(email, password);

    if (!user) {
      return jsonResponse({ error: "Invalid password or email" }, 401);
    }

    // SECTION - 3. Generate Token pair: access & refresh
    const accessToken = await createAccessToken(user._id, user.email);

    const { token: refreshToken, tokenId } = await createRefreshToken(
      user._id,
      user.email,
    );

    const familyId = crypto.randomUUID();

    const deviceInfo = request.headers.get("User-Agent") || "Unknown";

    // SECTION - Save Refresh token to DB (extract later?)
    const token = new Token({
      tokenId: tokenId,
      userId: user._id,
      familyId: familyId,
      deviceInfo: deviceInfo,
    });

    console.log("saving token in login", token.tokenId);
    await token.save();

    // SECTION - 4. Return tokens as cookies
    request.cookies.set("refreshToken", refreshToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: true,
      path: "/refresh",
    });

    return jsonResponse<{
      message: string;
      accessToken: string;
      user: UserData;
    }>({
      message: "Login succesful",
      accessToken: accessToken,
      user: { name: user.name, email: user.email },
    });
  } catch (e) {
    console.log(e);
    return jsonResponse({ error: "Unable to login" }, 400);
  }
}

export async function refresh(request: BunRequest): Promise<Response> {
  console.log("refresh function fired");
  try {
    console.log("attempting to get token from cookies");
    const refreshToken = request.cookies.get("refreshToken");

    if (!refreshToken) {
      console.info("no refresh token");
      return jsonResponse({ error: "Refresh token required" }, 400);
    }

    console.log("attempting verify token");
    const payload = await verifyRefreshToken(refreshToken);

    const storedToken = await getStoredToken(payload.jti as string);

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

    // FIXME - this function needs to use the DB
    await revokeToken(payload.jti as string);

    // FIXME - Replace with a "rotate token" function, probably, set tokens on req object instead
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

    const user = await userController.getUserById(payload.sub);

    if (!user) {
      console.log("valid token, could not find user");
      return jsonResponse({ error: "Something went wrong" }, 500);
    }

    console.log("refreshed, user is: ", user.name);
    request.cookies.set("refreshToken", newRefreshToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: true,
      path: "/refresh",
    });
    return jsonResponse<{ accessToken: string; user: UserData }>({
      accessToken: newAccessToken,
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.log(error);
    return jsonResponse({ error: "Invalid refresh token" }, 401);
  }
}

export async function logout(request: BunRequest): Promise<Response> {
  try {
    const refreshToken = request.cookies.get("refreshToken");

    if (!refreshToken) {
      console.info("no refresh token");
      return jsonResponse({ error: "Refresh token required" }, 400);
    }

    const payload = await verifyRefreshToken(refreshToken);
    await revokeToken(payload.jti as string);

    return jsonResponse({ message: "Logged out successfully" });
  } catch (error) {
    return jsonResponse({ message: "Logged out" });
  }
}
