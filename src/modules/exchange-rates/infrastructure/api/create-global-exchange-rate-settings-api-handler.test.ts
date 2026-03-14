import type { NextApiRequest, NextApiResponse } from "next";

import type { TursoDatabase } from "@/modules/shared/infrastructure/database/drizzle/turso-database";

jest.mock("../../../auth/infrastructure/next-auth/authenticated-user-email", () => ({
  getAuthenticatedUserEmailFromRequest: jest.fn(),
}));

import { createGlobalExchangeRateSettingsApiHandler } from "./create-global-exchange-rate-settings-api-handler";

interface MockJsonResponse {
  body: unknown | undefined;
  headers: Record<string, string>;
  statusCode: number;
}

function createMockResponse(): NextApiResponse & MockJsonResponse {
  const response: MockJsonResponse & {
    json(payload: unknown): MockJsonResponse;
    setHeader(name: string, value: string): MockJsonResponse;
    status(code: number): MockJsonResponse;
  } = {
    body: undefined,
    headers: {},
    json(payload: unknown) {
      response.body = payload;
      return response;
    },
    setHeader(name: string, value: string) {
      response.headers[name] = value;
      return response;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    statusCode: 200,
  };

  return response as unknown as NextApiResponse & MockJsonResponse;
}

describe("createGlobalExchangeRateSettingsApiHandler", () => {
  const originalAllowlist = process.env.GOOGLE_ADMIN_EMAIL_ALLOWLIST;

  beforeEach(() => {
    process.env.GOOGLE_ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.GOOGLE_ADMIN_EMAIL_ALLOWLIST = originalAllowlist;
  });

  it("allows admins to save the global IIBB value", async () => {
    const database = {} as TursoDatabase;
    const save = jest.fn().mockResolvedValue({
      iibbRateDecimal: 0.04,
    });
    const handler = createGlobalExchangeRateSettingsApiHandler({
      getDatabase: jest.fn().mockResolvedValue(database),
      getUserEmail: jest.fn().mockResolvedValue("admin@example.com"),
      save,
    });
    const request = {
      body: {
        iibbRateDecimal: 0.04,
      },
      method: "POST",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(save).toHaveBeenCalledWith({
      command: {
        iibbRateDecimal: 0.04,
      },
      database,
      request,
      userEmail: "admin@example.com",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      data: {
        iibbRateDecimal: 0.04,
      },
    });
  });

  it("returns 403 for authenticated users outside the admin allowlist", async () => {
    const handler = createGlobalExchangeRateSettingsApiHandler({
      getDatabase: jest.fn(),
      getUserEmail: jest.fn().mockResolvedValue("user@example.com"),
      save: jest.fn(),
    });
    const request = {
      body: {
        iibbRateDecimal: 0.04,
      },
      method: "POST",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      error: "Only Google admins can update the global IIBB configuration.",
    });
  });

  it("returns 400 when the payload is invalid", async () => {
    const handler = createGlobalExchangeRateSettingsApiHandler({
      getDatabase: jest.fn(),
      getUserEmail: jest.fn(),
      save: jest.fn(),
    });
    const request = {
      body: {
        iibbRateDecimal: "0.04",
      },
      method: "POST",
    } as unknown as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error:
        "global-exchange-rate-settings requires a JSON body with a numeric iibbRateDecimal value.",
    });
  });
});
