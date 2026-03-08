import type { NextApiHandler, NextApiRequest } from "next";
import type { drive_v3 } from "googleapis";
import { z } from "zod";

import {
  GoogleOAuthAuthenticationError,
  GoogleOAuthConfigurationError,
} from "@/server/auth/google-oauth-token";

const storageRequestBodySchema = z.object({
  content: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export interface StorageApiCommand {
  content: string;
  mimeType: string;
  name: string;
}

async function getDefaultDriveClient(request: NextApiRequest) {
  const { getGoogleDriveClientFromRequest } = await import(
    "../auth/google-drive-client"
  );

  return getGoogleDriveClientFromRequest(request);
}

export function createStorageApiHandler<TResult>({
  getDriveClient = getDefaultDriveClient,
  operationLabel,
  save,
}: {
  getDriveClient?: (
    request: NextApiRequest,
  ) => Promise<drive_v3.Drive>;
  operationLabel: string;
  save: (dependencies: {
    command: StorageApiCommand;
    driveClient: drive_v3.Drive;
    request: NextApiRequest;
  }) => Promise<TResult>;
}): NextApiHandler {
  return async function storageApiHandler(request, response) {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");

      return response.status(405).json({
        error: `storage:${operationLabel} only supports POST requests on this endpoint.`,
      });
    }

    const parsedBody = storageRequestBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return response.status(400).json({
        error: `storage:${operationLabel} requires a JSON body with non-empty string values for name, mimeType, and content.`,
      });
    }

    try {
      const driveClient = await getDriveClient(request);
      const result = await save({
        command: parsedBody.data,
        driveClient,
        request,
      });

      return response.status(201).json({
        data: result,
      });
    } catch (error) {
      if (error instanceof GoogleOAuthAuthenticationError) {
        return response.status(401).json({
          error: `Google authentication is required before saving ${operationLabel} to Drive.`,
        });
      }

      if (error instanceof GoogleOAuthConfigurationError) {
        return response.status(500).json({
          error: `Google OAuth server configuration is incomplete for ${operationLabel} Drive storage.`,
        });
      }

      return response.status(500).json({
        error: `We could not save ${operationLabel} to Google Drive. Try again later.`,
      });
    }
  };
}
