import type { BunRequest } from "bun";
import { userController } from "../controllers/userController";
import { Token } from "../models/token";
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
import { DataResponse, ErrorResponse } from "../models/response";

export interface AccessData {
  accessToken: string;
  user: UserData;
}

export async function register(
  request: BunRequest,
): Promise<DataResponse<AccessData>> {
  try {
    console.log("[/register] trying to register: ", request);
    const { email, name, password } = (await request.json()) as {
      email: string;
      name: string;
      password: string;
    };

    if (!email || !password) {
      return new ErrorResponse("/register: no email or password provied", 400);
    }

    console.log("[/register][info]: creating new user");

    const user = await userController.createUser({
      email: email,
      name: name,
      password: password,
    }); // SECTION - 3. Generate Token pair: access & refresh
    const accessToken = await createAccessToken(user.id, user.email);

    const { token: refreshToken, tokenId } = await createRefreshToken(
      user.id,
      user.email,
    );

    const familyId = crypto.randomUUID();

    const deviceInfo = request.headers.get("User-Agent") || "Unknown";

    // SECTION - Save Refresh token to DB (extract later?)
    const token = new Token({
      tokenId: tokenId,
      userId: user.id,
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

    return new DataResponse<AccessData>({ accessToken, user });
  } catch (error) {
    console.error("[/register]: ", error);
    if (error instanceof Error && error.message === "User already exists") {
      return new ErrorResponse(
        "There is already an account registered to this email",
        409,
      );
    }

    return new ErrorResponse("Unable to register user");
  }
}

export async function login(
  request: BunRequest,
): Promise<DataResponse<AccessData> | ErrorResponse> {
  try {
    console.log("login");
    // SECTION - 2. Receive and validate Credentials
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

    const user = await userController.validateCredentials(email, password);

    if (!user) {
      return new ErrorResponse("Invalid password or email", 401);
    }

    // SECTION - 3. Generate Token pair: access & refresh
    const accessToken = await createAccessToken(user.id, user.email);

    const { token: refreshToken, tokenId } = await createRefreshToken(
      user.id,
      user.email,
    );

    const familyId = crypto.randomUUID();

    const deviceInfo = request.headers.get("User-Agent") || "Unknown";

    // SECTION - Save Refresh token to DB (extract later?)
    const token = new Token({
      tokenId: tokenId,
      userId: user.id,
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

    return new DataResponse({
      accessToken: accessToken,
      user: { name: user.name, email: user.email, id: user.id },
    });
  } catch (e) {
    console.log(e);
    return new ErrorResponse("Unable to login", 400);
  }
}

export async function refresh(request: BunRequest): Promise<Response> {
  console.log("refresh function fired");
  try {
    console.log("attempting to get token from cookies");
    const refreshToken = request.cookies.get("refreshToken");

    if (!refreshToken) {
      console.info("no refresh token");
      return new ErrorResponse("Refresh token required", 400);
    }

    console.log("attempting verify token");
    const payload = await verifyRefreshToken(refreshToken);

    const storedToken = await getStoredToken(payload.jti as string);

    if (!storedToken) {
      console.info("could not find stored token");
      return new ErrorResponse("Refresh token not found", 401);
    }

    console.log(
      "[login] found the token with id: ",
      storedToken.tokenId,
      " revoked status is: ",
      storedToken.revoked,
    );

    if (storedToken.revoked) {
      revokeTokenFamily(storedToken.familyId);
      return new ErrorResponse(
        "Token reuse detected, please login again.",
        401,
      );
    }

    await revokeToken(payload.jti as string);

    // FIXME - Replace with a "rotate token" function, probably, set tokens on req object instead?
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
      return new ErrorResponse("Something went wrong");
    }

    console.log("refreshed, user is: ", user.name, "\n");
    request.cookies.set("refreshToken", newRefreshToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: true,
      path: "/refresh",
    });

    return new DataResponse<AccessData>({ accessToken: newAccessToken, user });
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Invalid refresh token", 401);
  }
}

export async function logout(
  request: BunRequest,
): Promise<DataResponse<{ message: string }> | ErrorResponse> {
  try {
    const refreshToken = request.cookies.get("refreshToken");

    if (!refreshToken) {
      console.info("no refresh token");
      return new ErrorResponse("Refresh token required", 400);
    }

    const payload = await verifyRefreshToken(refreshToken);
    console.log("[logout] revoking token: ", payload.jti);
    await revokeToken(payload.jti as string);

    return new DataResponse({ message: "Log out successful" });
  } catch (error) {
    console.log("[/logout] Something went wrong: ", error);
    return new DataResponse({ message: "Logged out" });
  }
}
