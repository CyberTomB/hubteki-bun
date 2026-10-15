import { randomUUIDv7 } from "bun";
import { User, type UserData } from "../models/user";

class UserController {
  public async createUser(userInfo: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserData> {
    console.log("checking for existing user");
    const { name, email, password } = userInfo;
    const existingUser = (await User.findOne({ email: email })) ?? null;

    if (existingUser) {
      console.log("found user: ", existingUser.email);
      throw new Error("User already exists");
    }

    const id = randomUUIDv7();
    console.log("creating new user with ID: ", id);
    const hash = await Bun.password.hash(password);

    try {
      await User.create({
        _id: id,
        name: name,
        email: email,
        passwordHash: hash,
      });
    } catch (e) {
      throw new Error("failed to create user");
    }

    const newUser = await User.findOne({ _id: id });

    if (!newUser) {
      throw new Error(
        `User may have been created but could not be found with id: ${id}`,
      );
    }

    return newUser;
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserData> {
    console.log("lookup user: ", email);
    const user = await User.findOne({ email: email });

    if (!user) {
      console.log("no user found");
      await Bun.password.hash(password);
      throw new Error("No User Found");
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid User");
    }

    return user;
  }

  public getUserById(id: string) {
    return User.findOne({ _id: id });
  }
}

export const userController = new UserController();
