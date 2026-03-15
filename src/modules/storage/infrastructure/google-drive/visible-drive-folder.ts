import type { drive_v3 } from "googleapis";

import {
  LEGACY_VISIBLE_DRIVE_FOLDER_NAME,
  VISIBLE_DRIVE_FOLDER_NAME,
} from "@/modules/storage/shared/visible-drive-folder-name";

import { mapGoogleDriveStorageError } from "./google-drive-storage-error";

const DRIVE_FILES_CREATE_ENDPOINT = "drive.files.create";
const DRIVE_FILES_LIST_ENDPOINT = "drive.files.list";
const DRIVE_FOLDER_FIELDS = "id,name,mimeType";
const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

function escapeGoogleDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function findVisibleDriveFolder({
  driveClient,
  operation,
}: {
  driveClient: drive_v3.Drive;
  operation: string;
}) {
  const canonicalFolder = await findDriveFolderByName({
    driveClient,
    folderName: VISIBLE_DRIVE_FOLDER_NAME,
    operation,
  });

  if (canonicalFolder) {
    return canonicalFolder;
  }

  const legacyFolder = await findDriveFolderByName({
    driveClient,
    folderName: LEGACY_VISIBLE_DRIVE_FOLDER_NAME,
    operation,
  });

  if (!legacyFolder?.id) {
    return null;
  }

  try {
    const response = await driveClient.files.update({
      fields: DRIVE_FOLDER_FIELDS,
      fileId: legacyFolder.id,
      requestBody: {
        name: VISIBLE_DRIVE_FOLDER_NAME,
      },
    });

    return response.data;
  } catch {
    // If renaming the legacy folder fails, continue using the legacy folder.
    return legacyFolder;
  }
}

async function findDriveFolderByName({
  driveClient,
  folderName,
  operation,
}: {
  driveClient: drive_v3.Drive;
  folderName: string;
  operation: string;
}) {
  try {
    const response = await driveClient.files.list({
      fields: `files(${DRIVE_FOLDER_FIELDS})`,
      orderBy: "modifiedTime desc",
      pageSize: 1,
      q: `name = '${escapeGoogleDriveQueryValue(folderName)}' and mimeType = '${DRIVE_FOLDER_MIME_TYPE}' and trashed = false`,
    });

    return response.data.files?.[0] ?? null;
  } catch (error) {
    throw mapGoogleDriveStorageError(error, {
      endpoint: DRIVE_FILES_LIST_ENDPOINT,
      operation: `${operation}:findByName`,
    });
  }
}

export async function getOrCreateVisibleDriveFolder({
  driveClient,
  operation,
}: {
  driveClient: drive_v3.Drive;
  operation: string;
}) {
  const existingFolder = await findVisibleDriveFolder({
    driveClient,
    operation: `${operation}:findFolder`,
  });

  if (existingFolder?.id) {
    return existingFolder;
  }

  try {
    const response = await driveClient.files.create({
      fields: DRIVE_FOLDER_FIELDS,
      requestBody: {
        mimeType: DRIVE_FOLDER_MIME_TYPE,
        name: VISIBLE_DRIVE_FOLDER_NAME,
      },
    });

    if (!response.data.id) {
      throw new Error("Google Drive did not return an id for the visible folder.");
    }

    return response.data;
  } catch (error) {
    throw mapGoogleDriveStorageError(error, {
      endpoint: DRIVE_FILES_CREATE_ENDPOINT,
      operation,
    });
  }
}
