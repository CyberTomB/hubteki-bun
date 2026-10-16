import type { BunRequest } from "bun";
import { userController } from "../controllers/userController";
import { DataResponse, ErrorResponse } from "../models/response";
import { sessionController } from "../controllers/sessionController";
import type { UserData } from "../models/user";

export async function register(
  request: BunRequest,
): Promise<DataResponse<UserData>> {
  try {
    console.log("[register] trying to register: ", request);
    const { email, name, password } = (await request.json()) as {
      email: string;
      name: string;
      password: string;
    };

    if (!email || !password) {
      return new ErrorResponse("[register]: no email or password provied", 400);
    }

    console.log("[register][info]: creating new user");

    const user = await userController.createUser({
      email: email,
      name: name,
      password: password,
    });

    return new DataResponse<UserData>({
      name: user.name,
      email: user.email,
    });
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
): Promise<DataResponse<UserData> | ErrorResponse> {
  try {
    console.log("login");
    const isProduction = process.env.NODE_ENV === "production";
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

    const user = await userController.getAuthenticatedUser(email, password);

    if (!user) {
      return new ErrorResponse("Invalid password or email", 401);
    }

    const token = await sessionController.createSession(user._id);

    request.cookies.set(isProduction ? "__Host-session" : "session", token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return new DataResponse({ name: user.name, email: user.email });
  } catch (e) {
    console.log(e);
    return new ErrorResponse("Unable to login", 400);
  }
}

export async function refresh(request: BunRequest): Promise<Response> {
  console.log("refresh function fired");
  try {
    console.log("attempting to get token from cookies");
    const isProduction = process.env.NODE_ENV === "production";
    const token = request.cookies.get(
      isProduction ? "__Host-session" : "session",
    );

    if (!token) {
      console.log("no refresh token");
      return new ErrorResponse("Refresh token required", 400);
    }

    const session = await sessionController.getAuthenticatedSession(token);

    const user = await userController.getUserById(session.userId);

    if (!user) {
      console.log("valid token, could not find user");
      return new ErrorResponse("Something went wrong");
    }

    const newToken = await sessionController.rotateSession(session.userId);
    console.log("rotating session token, new token: ", newToken);

    console.log("refreshed, user is: ", user.name, "\n");
    request.cookies.set(isProduction ? "__Host-session" : "session", newToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return new DataResponse<UserData>({
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Invalid refresh token", 401);
  }
}

export async function logout(
  request: BunRequest,
): Promise<DataResponse<{ message: string }> | ErrorResponse> {
  const logger = (msg: string) => {
    console.log(`[logout] ${msg}`);
  };
  try {
    logger("attempt to get token from cookie");
    const isProduction = process.env.NODE_ENV === "production";
    const token = request.cookies.get(
      isProduction ? "__Host-session" : "session",
    );

    if (!token) {
      logger("no token found in cookie");
      return new ErrorResponse("Refresh token required", 400);
    }

    const session = await sessionController.getAuthenticatedSession(token);

    if (!session) {
      logger("no session found");
      throw new Error("session token invalid");
    }

    logger("deleting old session: " + token);
    await sessionController.revokeSession(token);

    logger("logging out");
    return new DataResponse({ message: "Log out successful" });
  } catch (error) {
    console.log("[/logout] Something went wrong: ", error);
    return new DataResponse({ message: "Logged out" });
  }
}
