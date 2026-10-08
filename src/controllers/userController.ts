import { User, type DBUser, type UserData } from "../models/user";
import { randomUUIDv7 } from "bun";
import { jsonResponse } from "../utils/jsonHelper";
import type { ObjectId } from "mongoose";

class UserController {
  public async createUser(userInfo: {
    name: string;
    email: string;
    password: string;
  }): Promise<DBUser> {
    console.log("checking for existing user");
    const { name, email, password } = userInfo;
    const existingUser = (await User.findOne({ email: email })) ?? null;

    if (existingUser) {
      console.log("found user: ", existingUser.email);
      throw new Error("User already exists");
    }

    const id = randomUUIDv7();
    console.log("creating new user with public ID: ", id);
    const hash = await Bun.password.hash(password);
    const newUser = new User({
      name: name,
      email: email,
      passwordHash: hash,
      publicId: id,
    });

    try {
      await newUser.save();
    } catch (e) {
      console.warn("Failed to save user: ", e);
      // return jsonResponse({ error: "Unable to create user" }, 500);
      throw new Error("Unable to create user");
    }

    return newUser;
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<DBUser | null> {
    console.log("lookup user: ", email);
    const user = await User.findOne({ email: email });

    if (!user) {
      console.log("no user found");
      await Bun.password.hash(password);
      return null;
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    return isValid ? user : null;
  }

  public getUserById(id: ObjectId) {
    return User.findOne(id);
  }

  public async getUserByPublicId(id: string): Promise<DBUser> {
    const user = await User.findOne<DBUser>({ publicId: id });

    if (!user) {
      throw new Error(`Could not find user with publicId ${id}`);
    }

    return user;
  }

  public getUserData(user: DBUser): UserData {
    return {
      email: user.email,
      name: user.name,
      id: user.publicId,
    };
  }
}

export const userController = new UserController();
