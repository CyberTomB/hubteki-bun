import { Model, model, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
}

const userSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
});

export const User = model("User", userSchema);
