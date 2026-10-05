import { model, Schema } from "mongoose";

export interface DBUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserData {
  name: string;
  email: string;
}

const userSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
});

export const User = model("User", userSchema);
