import { User, type DBUser, type UserData } from "../models/user";
import { randomUUIDv7 } from "bun";
import { jsonResponse } from "../utils/jsonHelper";

class UserController {
  public async createUser(userInfo: {
    name: string;
    email: string;
    password: string;
  }) {
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
    newUser.save();

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

  public getUserById(id: string) {
    return User.findOne({ _id: id });
  }

  public userResponse(data: DBUser): Response {
    return jsonResponse<UserData>(
      {
        email: data.email,
        id: data.publicId,
        name: data.name,
      },
      201,
    );
  }

  public accessResponse(data: DBUser, token: string): Response {
    return jsonResponse<UserData>({
      email: data.email,
      id: data.publicId,
      name: data.name,
      accessToken: token,
    });
  }
}

export const userController = new UserController();
