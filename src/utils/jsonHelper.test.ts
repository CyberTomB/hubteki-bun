import { expect, test } from "bun:test";
import { jsonResponse } from "./jsonHelper";

test("default response to be 200", () => {
  const res = jsonResponse({});

  expect(res.status).toBe(200);
});

test("response includes cors headers", () => {
  const res = jsonResponse({});

  const headers = res.headers.keys().toArray();

  expect(headers).toContain("access-control-allow-origin");
  expect(headers).toContain("access-control-allow-credentials");
  expect(headers).toContain("access-control-allow-methods");
  expect(headers).toContain("access-control-allow-headers");
});

test("response is content-type app/json", () => {
  const res = jsonResponse({});

  expect(res.headers.get("content-type")).toBe("application/json");
});
