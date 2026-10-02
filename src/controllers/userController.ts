import { Model, Schema } from "mongoose";
import { User, type IUser } from "../models/user";
import { randomUUIDv7 } from "bun";
import { jsonResponse } from "../middleware/auth";

class UserController {
  public async createUser(name: string, email: string, password: string) {
    console.log("checking for existing user");
    const existingUser = (await User.findOne({ email: email })) ?? null;

    if (existingUser) {
      console.log("found user: ", existingUser.email);
      throw new Error("User already exists");
    }

    const id = randomUUIDv7();
    console.log("creating new user with ID: ", id);
    const hash = await Bun.password.hash(password);
    const newUser = new User({
      _id: id,
      name: name,
      email: email,
      passwordHash: hash,
    });
    newUser.save();

    return jsonResponse({ message: "created user", id: id }, 201);
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<IUser | null> {
    const user = await User.findOne({ email: email });

    if (!user) {
      await Bun.password.hash(password);
      return null;
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    return isValid ? user : null;
  }

  public getUserById(id: string) {
    return User.findOne({ _id: id });
  }
}

export const userController = new UserController();
