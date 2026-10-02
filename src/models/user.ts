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

export class User extends Model implements IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;

  constructor(name: string, email: string, passwordHash: string) {
    super();
    const existingUser = this.find({ email: email });
    console.log("found user: ", existingUser.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    this._id = crypto.randomUUID();
    this.email = email;
    this.name = name;
    this.passwordHash = passwordHash;
  }

  static async build(name: string, email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    return new User(name, email, hash);
  }
}
