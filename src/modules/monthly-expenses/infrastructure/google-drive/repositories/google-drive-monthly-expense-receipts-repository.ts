import { Readable } from "node:stream";
import type { drive_v3 } from "googleapis";

import {
  MonthlyExpenseReceiptFolderConflictError,
} from "@/modules/monthly-expenses/application/errors/monthly-expense-receipt-folder-conflict-error";
import {
  mapGoogleDriveStorageError,
} from "@/modules/storage/infrastructure/google-drive/google-drive-storage-error";
import {
  getOrCreateVisibleDriveFolder,
} from "@/modules/storage/infrastructure/google-drive/visible-drive-folder";

import type {
  MonthlyExpenseReceiptUpload,
  MonthlyExpenseReceiptsRepository,
  MonthlyExpenseReceiptUploadInput,
  RenameMonthlyExpenseReceiptFolderInput,
} from "../../../domain/repositories/monthly-expense-receipts-repository";

const DRIVE_FILE_FIELDS = "id,name,mimeType,parents,webViewLink";
const DRIVE_FILES_CREATE_ENDPOINT = "drive.files.create";
const DRIVE_FILES_GET_ENDPOINT = "drive.files.get";
const DRIVE_FILES_LIST_ENDPOINT = "drive.files.list";
const DRIVE_PERMISSIONS_CREATE_ENDPOINT = "drive.permissions.create";
const DRIVE_FILES_UPDATE_ENDPOINT = "drive.files.update";
const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

function escapeGoogleDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildDriveFolderViewUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

function buildDriveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

function toReadableContent(contentBytes: Uint8Array): Readable {
  return Readable.from([Buffer.from(contentBytes)]);
}

export class GoogleDriveMonthlyExpenseReceiptsRepository
  implements MonthlyExpenseReceiptsRepository
{
  constructor(private readonly driveClient: drive_v3.Drive) {}

  async saveReceipt(
    input: MonthlyExpenseReceiptUploadInput,
  ): Promise<MonthlyExpenseReceiptUpload> {
    const rootFolder = await getOrCreateVisibleDriveFolder({
      driveClient: this.driveClient,
      operation:
        "google-drive-monthly-expense-receipts-repository:saveReceipt:getRootFolder",
    });

    if (!rootFolder.id) {
      throw new Error(
        "google-drive-monthly-expense-receipts-repository:saveReceipt could not resolve the visible root folder id.",
      );
    }

    const expenseFolder = await this.getOrCreateExpenseFolder({
      expenseDescription: input.expenseDescription,
      parentFolderId: rootFolder.id,
    });

    if (!expenseFolder.id) {
      throw new Error(
        "google-drive-monthly-expense-receipts-repository:saveReceipt could not resolve an expense folder id.",
      );
    }

    try {
      const response = await this.driveClient.files.create({
        fields: DRIVE_FILE_FIELDS,
        media: {
          body: toReadableContent(input.contentBytes),
          mimeType: input.mimeType,
        },
        requestBody: {
          name: input.fileName,
          parents: [expenseFolder.id],
        },
      });

      const fileId = response.data.id;

      if (!fileId) {
        throw new Error(
          "google-drive-monthly-expense-receipts-repository:saveReceipt did not receive a file id from Google Drive.",
        );
      }

      await this.trySetPublicReadPermission(fileId);

      return {
        fileId,
        fileName: response.data.name ?? input.fileName,
        fileViewUrl:
          response.data.webViewLink ?? buildDriveFileViewUrl(fileId),
        folderId: expenseFolder.id,
        folderViewUrl: buildDriveFolderViewUrl(expenseFolder.id),
      };
    } catch (error) {
      throw mapGoogleDriveStorageError(error, {
        endpoint: DRIVE_FILES_CREATE_ENDPOINT,
        operation:
          "google-drive-monthly-expense-receipts-repository:saveReceipt",
      });
    }
  }

  private async trySetPublicReadPermission(fileId: string): Promise<void> {
    try {
      await this.driveClient.permissions.create({
        fields: "id",
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (error) {
      const mappedError = mapGoogleDriveStorageError(error, {
        endpoint: DRIVE_PERMISSIONS_CREATE_ENDPOINT,
        operation:
          "google-drive-monthly-expense-receipts-repository:saveReceipt:setPublicPermission",
      });

      if (
        mappedError.code === "insufficient_permissions" ||
        mappedError.code === "invalid_scope" ||
        mappedError.code === "invalid_payload" ||
        mappedError.code === "unexpected"
      ) {
        // Some Google Workspace policies block public link permissions.
        // In that case, keep the uploaded file and let the owner access it.
        return;
      }

      throw mappedError;
    }
  }

  async renameExpenseFolder(
    input: RenameMonthlyExpenseReceiptFolderInput,
  ): Promise<void> {
    const normalizedFolderId = input.folderId.trim();
    const normalizedDescription = input.nextDescription.trim();

    if (!normalizedFolderId || !normalizedDescription) {
      throw new Error(
        "google-drive-monthly-expense-receipts-repository:renameExpenseFolder requires a folder id and description.",
      );
    }

    const folder = await this.getFolderById(normalizedFolderId);

    if (!folder.id) {
      throw new Error(
        "google-drive-monthly-expense-receipts-repository:renameExpenseFolder could not resolve folder id.",
      );
    }

    const parentFolderId = folder.parents?.[0];

    if (!parentFolderId) {
      throw new Error(
        "google-drive-monthly-expense-receipts-repository:renameExpenseFolder could not resolve parent folder id.",
      );
    }

    const conflictingFolder = await this.findExpenseFolderByName({
      expenseDescription: normalizedDescription,
      parentFolderId,
    });

    if (
      conflictingFolder?.id &&
      conflictingFolder.id !== normalizedFolderId
    ) {
      throw new MonthlyExpenseReceiptFolderConflictError(
        "A receipt folder with the requested description already exists in Drive.",
      );
    }

    if (folder.name === normalizedDescription) {
      return;
    }

    try {
      await this.driveClient.files.update({
        fields: DRIVE_FILE_FIELDS,
        fileId: normalizedFolderId,
        requestBody: {
          name: normalizedDescription,
        },
      });
    } catch (error) {
      throw mapGoogleDriveStorageError(error, {
        endpoint: DRIVE_FILES_UPDATE_ENDPOINT,
        operation:
          "google-drive-monthly-expense-receipts-repository:renameExpenseFolder",
      });
    }
  }

  private async getFolderById(folderId: string) {
    try {
      const response = await this.driveClient.files.get({
        fields: DRIVE_FILE_FIELDS,
        fileId: folderId,
      });

      return response.data;
    } catch (error) {
      throw mapGoogleDriveStorageError(error, {
        endpoint: DRIVE_FILES_GET_ENDPOINT,
        operation:
          "google-drive-monthly-expense-receipts-repository:getFolderById",
      });
    }
  }

  private async getOrCreateExpenseFolder({
    expenseDescription,
    parentFolderId,
  }: {
    expenseDescription: string;
    parentFolderId: string;
  }) {
    const existingFolder = await this.findExpenseFolderByName({
      expenseDescription,
      parentFolderId,
    });

    if (existingFolder?.id) {
      return existingFolder;
    }

    try {
      const response = await this.driveClient.files.create({
        fields: DRIVE_FILE_FIELDS,
        requestBody: {
          mimeType: DRIVE_FOLDER_MIME_TYPE,
          name: expenseDescription,
          parents: [parentFolderId],
        },
      });

      return response.data;
    } catch (error) {
      throw mapGoogleDriveStorageError(error, {
        endpoint: DRIVE_FILES_CREATE_ENDPOINT,
        operation:
          "google-drive-monthly-expense-receipts-repository:getOrCreateExpenseFolder",
      });
    }
  }

  private async findExpenseFolderByName({
    expenseDescription,
    parentFolderId,
  }: {
    expenseDescription: string;
    parentFolderId: string;
  }) {
    try {
      const response = await this.driveClient.files.list({
        fields: `files(${DRIVE_FILE_FIELDS})`,
        orderBy: "modifiedTime desc",
        pageSize: 1,
        q: `name = '${escapeGoogleDriveQueryValue(expenseDescription)}' and mimeType = '${DRIVE_FOLDER_MIME_TYPE}' and '${escapeGoogleDriveQueryValue(parentFolderId)}' in parents and trashed = false`,
      });

      return response.data.files?.[0] ?? null;
    } catch (error) {
      throw mapGoogleDriveStorageError(error, {
        endpoint: DRIVE_FILES_LIST_ENDPOINT,
        operation:
          "google-drive-monthly-expense-receipts-repository:findExpenseFolderByName",
      });
    }
  }
}
