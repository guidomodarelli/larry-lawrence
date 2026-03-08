import type { NextApiRequest, NextApiResponse } from "next";
import type { drive_v3 } from "googleapis";

import { GoogleOAuthAuthenticationError } from "@/server/auth/google-oauth-token";

import { createStorageApiHandler } from "./create-storage-api-handler";

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

describe("createStorageApiHandler", () => {
  it("rejects methods other than POST", async () => {
    const getDriveClient = jest.fn();
    const save = jest.fn();
    const handler = createStorageApiHandler({
      getDriveClient,
      operationLabel: "application settings",
      save,
    });

    const request = {
      body: {},
      method: "GET",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(response.headers).toEqual({ Allow: "POST" });
    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({
      error:
        "storage:application settings only supports POST requests on this endpoint.",
    });
    expect(getDriveClient).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is invalid", async () => {
    const handler = createStorageApiHandler({
      getDriveClient: jest.fn(),
      operationLabel: "application settings",
      save: jest.fn(),
    });

    const request = {
      body: {
        content: "  ",
        mimeType: "application/json",
        name: "",
      },
      method: "POST",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error:
        "storage:application settings requires a JSON body with non-empty string values for name, mimeType, and content.",
    });
  });

  it("returns 401 when Google authentication is missing", async () => {
    const handler = createStorageApiHandler({
      getDriveClient: jest
        .fn()
        .mockRejectedValue(
          new GoogleOAuthAuthenticationError(
            "google-drive-client:getGoogleSessionTokenFromRequest requires an authenticated NextAuth session.",
          ),
        ),
      operationLabel: "application settings",
      save: jest.fn(),
    });

    const request = {
      body: {
        content: "{\"theme\":\"dark\"}",
        mimeType: "application/json",
        name: "application-settings.json",
      },
      method: "POST",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      error:
        "Google authentication is required before saving application settings to Drive.",
    });
  });

  it("returns 201 with the saved payload when the request succeeds", async () => {
    const driveClient = {} as drive_v3.Drive;
    const save = jest.fn().mockResolvedValue({
      id: "settings-file-id",
      mimeType: "application/json",
      name: "application-settings.json",
    });
    const handler = createStorageApiHandler({
      getDriveClient: jest.fn().mockResolvedValue(driveClient),
      operationLabel: "application settings",
      save,
    });

    const request = {
      body: {
        content: "{\"theme\":\"dark\"}",
        mimeType: "application/json",
        name: "application-settings.json",
      },
      method: "POST",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(save).toHaveBeenCalledWith({
      command: {
        content: "{\"theme\":\"dark\"}",
        mimeType: "application/json",
        name: "application-settings.json",
      },
      driveClient,
      request,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      data: {
        id: "settings-file-id",
        mimeType: "application/json",
        name: "application-settings.json",
      },
    });
  });

  it("returns 500 when Drive storage fails unexpectedly", async () => {
    const handler = createStorageApiHandler({
      getDriveClient: jest.fn().mockResolvedValue({} as drive_v3.Drive),
      operationLabel: "application settings",
      save: jest
        .fn()
        .mockRejectedValue(
          new Error(
            "storage:application settings could not persist the Google Drive file.",
          ),
        ),
    });

    const request = {
      body: {
        content: "{\"theme\":\"dark\"}",
        mimeType: "application/json",
        name: "application-settings.json",
      },
      method: "POST",
    } as NextApiRequest;
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error:
        "We could not save application settings to Google Drive. Try again later.",
    });
  });
});
