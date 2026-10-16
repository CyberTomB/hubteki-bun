import { model, Schema } from "mongoose";

export interface ISession {
  tokenHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
  expiresAt: { type: Date, default: new Date().getDate() + 7 },
});

export const Session = model("Session", sessionSchema);
