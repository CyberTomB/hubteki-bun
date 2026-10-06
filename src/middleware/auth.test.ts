import { expect, test } from "bun:test";
import { authMiddleware } from "./auth";

test("authMiddleware", () => {
  const req = new Request("https://localhost:3000/test");
  req.headers.set("set-cookie", "cookie");
  req.headers.set("set-cookie", "other cookie");

  const res = authMiddleware(req);
});
