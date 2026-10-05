import { Token, type IToken } from "../models/token";

// TODO - replace with mongoDB
const refreshTokens = new Map<string, IToken>();

export async function storeRefreshToken(): Promise<void> {
  const data = await Token.create();
  console.log("token saved: ", data);
}

export async function getStoredToken(tokenId: string): Promise<IToken | null> {
  return await Token.findOne({ tokenId: tokenId });
}

// TODO: replace with Mongo
export function revokeToken(tokenId: string): boolean {
  const token = refreshTokens.get(tokenId);
  if (token) {
    token.revoked = true;
    return true;
  }
  return false;
}

export function revokeTokenFamily(familyId: string): void {
  for (const token of refreshTokens.values()) {
    if (token.familyId === familyId) {
      token.revoked = true;
    }
  }
}

export function revokeAllUserTokens(userId: string): void {
  for (const token of refreshTokens.values()) {
    if (token.userId === userId) {
      token.revoked = true;
    }
  }
}

export function getUserSessions(userId: string): IToken[] {
  return Array.from(refreshTokens.values()).filter(
    (t) => t.userId === userId && !t.revoked && t.expiresAt > new Date(),
  );
}

export function cleanupExpiredTokens(): number {
  const now = new Date();
  let removed = 0;

  for (const [tokenId, token] of refreshTokens.entries()) {
    if (token.expiresAt < now) {
      refreshTokens.delete(tokenId);
      removed++;
    }
  }

  return removed;
}
