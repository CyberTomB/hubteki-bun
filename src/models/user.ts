import { model, Schema } from "mongoose";

export interface DBUser {
  name: string;
  email: string;
  passwordHash: string;
  publicId: string;
  _id: string;
}

export interface UserData {
  name: string;
  email: string;
  id: string;
  accessToken?: string;
}

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  publicId: { type: String, required: true },
  _id: { type: String, required: true },
});

export const User = model("User", userSchema);
