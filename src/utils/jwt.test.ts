import { expect, test } from "bun:test";
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

test("createAccessToken", async () => {
  expect(await createAccessToken("test", "email")).toBe("test");
});
