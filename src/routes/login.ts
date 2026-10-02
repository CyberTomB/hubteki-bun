import { userController } from "../controllers/userController";
import { jsonResponse } from "../utils/jsonHelper";

export async function register(request: Request) {
  try {
    console.log("trying to register: ", request);
    const { email, name, password } = (await request.json()) as {
      email: string;
      name: string;
      password: string;
    };

    if (!email || !password) {
      return jsonResponse({ error: "how tf did you get to this place?" }, 400);
    }

    console.info("building user");
    const res = await userController.createUser(email, name, password);

    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return jsonResponse(
        { error: "There is already an account registered to this email" },
        409,
      );
    }
    console.error(error);

    return jsonResponse(
      { error: "Something failed when trying to register" },
      500,
    );
  }
}

// export default async function login(request: LoginRequest): Promise<Response> {
//     try {
//         const body = await request.json() as LoginRequest;
//         const {email, password} = body;
//     } catch(e) {
//         console.log(e);
//         return new Response;
//     }

//     return new Response
// }

export async function refresh(request: Request): Promise<Response> {
    try {
        const body = await request.json();
        console.log('refresh function: ', body)
        const {refreshToken} = body;

        if(!refreshToken) {
            return jsonResponse({error: "Refresh token required"}, 400)
        }
    }
}