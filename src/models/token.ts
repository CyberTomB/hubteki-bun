import { model, Schema } from "mongoose";

export interface IToken {
  tokenId: string;
  userId: string;
  familyId: string;
  deviceInfo: string;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

const tokenSchema = new Schema({
  tokenId: { type: String, required: true },
  userId: { type: String, required: true },
  familyId: { type: String, required: true },
  deviceInfo: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
  expiresAt: { type: Date, default: new Date().getDate() + 7 },
  revoked: { type: Boolean, default: false },
});

export const Token = model("Token", tokenSchema);
