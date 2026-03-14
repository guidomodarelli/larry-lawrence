import type { NextApiRequest } from "next";

import {
  appLogger,
  createRequestLogContext,
} from "./app-logger";

describe("appLogger", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("redacts sensitive values in structured logs", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    appLogger.error("storage save failed", {
      context: {
        nested: {
          googleRefreshToken: "refresh-token-value",
          month: "2026-03",
        },
        operation: "storage:save",
        token: "access-token-value",
      },
      error: new Error("google failure"),
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          nested: expect.objectContaining({
            googleRefreshToken: "[REDACTED]",
            month: "2026-03",
          }),
          operation: "storage:save",
          token: "[REDACTED]",
        }),
        error: expect.objectContaining({
          message: "google failure",
          name: "Error",
        }),
        level: "error",
        message: "storage save failed",
      }),
    );
  });

  it("extracts request metadata from incoming requests", () => {
    const request = {
      headers: {
        "x-request-id": "request-id-123",
      },
      method: "POST",
      url: "/api/storage/monthly-expenses?month=2026-03",
    } as unknown as NextApiRequest;

    expect(createRequestLogContext(request)).toEqual({
      requestId: "request-id-123",
      requestMethod: "POST",
      requestPath: "/api/storage/monthly-expenses?month=2026-03",
    });
  });
});