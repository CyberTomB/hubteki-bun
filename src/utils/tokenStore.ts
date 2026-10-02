interface StoredToken {
  tokenId: string;
  userId: string;
  familyId: string;
  deviceInfo: string;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}
// TODO - replace with mongoDB
const refreshTokens = new Map<string, StoredToken>();

export function storeRefreshToken(
  tokenId: string,
  userId: string,
  familyId: string,
  deviceInfo: string,
  expiresInDays: number = 7,
): void {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  refreshTokens.set(tokenId, {
    tokenId,
    userId,
    familyId,
    deviceInfo,
    createdAt: new Date(),
    expiresAt,
    revoked: false,
  });
}

export function getStoredToken(tokenId: string): StoredToken | undefined {
  return refreshTokens.get(tokenId);
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

export function getUserSessions(userId: string): StoredToken[] {
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
