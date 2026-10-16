import { Session, type ISession } from "../models/session";

class SessionController {
  private createToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString("base64url");
  }

  private async hashToken(token: string): Promise<string> {
    return await Bun.CryptoHasher.hash("sha256", token, "hex");
  }

  public async createSession(userId: string): Promise<string> {
    const token = this.createToken();
    await Session.create({
      tokenHash: await this.hashToken(token),
      createdAt: new Date(Date.now()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: userId,
    });

    return token;
  }

  public async rotateSession(userId: string): Promise<string> {
    console.log("[session controller] revoking all user sessions");
    const result = await Session.deleteMany({ userId: userId });
    console.log(`[session controller] deleted ${result.deletedCount} tokens`);
    return await this.createSession(userId);
  }

  public async revokeSession(token: string): Promise<void> {
    const hash = await this.hashToken(token);
    const { acknowledged, deletedCount } = await Session.deleteOne({
      tokenHash: hash,
    });

    if (!(acknowledged && deletedCount > 0)) {
      throw new Error("unable to delete previous session");
    }
  }

  public async getAuthenticatedSession(token: string) {
    const hash = await this.hashToken(token);
    const session = await Session.findOne({
      tokenHash: hash,
    });

    if (!session) {
      throw new Error();
    }

    const now = new Date(Date.now());
    if (new Date(session.expiresAt) < now) {
      console.log(
        "[validate session][error]: token expired",
        now,
        session.expiresAt,
      );
      throw new Error();
    }

    return session;
  }
}

export const sessionController = new SessionController();
