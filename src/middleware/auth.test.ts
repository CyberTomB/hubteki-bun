import { beforeEach, describe, expect, it, mock, spyOn, test } from "bun:test";

const jsonResponse = mock((data: object, status: number) => {
  return { data, status };
});

mock.module("../utils/jsonHelper", () => {
  return {
    jsonResponse,
  };
});

import { authMiddleware, type AuthenticatedRequest } from "./auth";

const request = new Request(
  "http://localhost:3000/test",
) as AuthenticatedRequest;

beforeEach(() => {
  mock.clearAllMocks();
});

describe("authMiddleware", () => {
  it("returns a 401 response if Authorization header is missing", async () => {
    await authMiddleware(request);

    expect(jsonResponse.mock.calls).toHaveLength(1);
    expect(jsonResponse.mock.calls[0]![1]).toBe(401);
  });

  it("returns a 401 response if Auth does not start with Bearer", async () => {
    request.headers.set("Authorization", "Beeble " + crypto.randomUUID());
    await authMiddleware(request);

    expect(jsonResponse.mock.calls).toHaveLength(1);
    expect(jsonResponse.mock.calls[0]![1]).toBe(401);
  });

  it("returns a 401 response if Auth token is missing after Bearer prefix", async () => {
    request.headers.set("Authorization", "Bearer ");
    const testheader = request.headers.get("Authorization");
    expect(testheader?.startsWith("Bearer")).toBeTrue();

    await authMiddleware(request);

    expect(jsonResponse.mock.calls).toHaveLength(1);
    expect(jsonResponse.mock.calls[0]![1]).toBe(401);
  });
});
