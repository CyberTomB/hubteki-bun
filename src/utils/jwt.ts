import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { config } from "../config";

const issuer = "bun-auth-service";
const audience = "bun-api";

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
  jti: string;
}

const accessSecret = new TextEncoder().encode(config.jwtSecret);
const refreshSecret = new TextEncoder().encode(config.refreshSecret);

function generateTokenId(): string {
  return crypto.randomUUID();
}

export async function createAccessToken(
  userId: string,
  email: string,
): Promise<string> {
  const tokenId = generateTokenId();

  const token = await new SignJWT({
    sub: userId,
    email: email,
    type: "access",
    jti: tokenId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.accessTokenExpiry)
    .setIssuer("bun-auth-service")
    .setAudience("bun-api")
    .sign(accessSecret);

  return token;
}

export async function createRefreshToken(
  userId: string,
  email: string,
): Promise<{ token: string; tokenId: string }> {
  const tokenId = generateTokenId();

  const token = await new SignJWT({
    sub: userId,
    email: email,
    type: "refresh",
    jti: tokenId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.refreshTokenExpiry)
    .setIssuer("bun-auth-service")
    .setAudience("bun-api")
    .sign(refreshSecret);

  return { token, tokenId };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      issuer: issuer,
      audience: audience,
    });

    if (payload.type !== "access") {
      console.log("type is not access");
      throw new Error("Invalid token type (received type other than access)");
    }

    console.log("returning payload: ", payload);
    return payload as TokenPayload;
  } catch (error) {
    // NOTE - Add logging?
    console.log("some other error occurred: ", error);
    throw new Error("Invalid or expired access token");
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    console.log("[jwt] Verifying the token");
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: issuer,
      audience: audience,
    });

    if (payload.type !== "refresh") {
      throw new Error(
        `Invalid token type (received ${payload.type} instead of refresh)`,
      );
    }

    return payload as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}
