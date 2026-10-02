import { Model, Schema } from "mongoose";
import { User, type IUser } from "../models/user";

class UserController {
  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<IUser | null> {
    const user = await User.findOne<User>({ email: email });

    if (!user) {
      await Bun.password.hash(password);
      return null;
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    return isValid ? user : null;
  }

  public getUserById(id: string) {
    return User.findOne<User>({ _id: id });
  }
}
