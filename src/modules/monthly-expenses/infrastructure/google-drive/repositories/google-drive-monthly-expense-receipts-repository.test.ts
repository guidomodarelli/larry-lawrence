import type { drive_v3 } from "googleapis";

import { GoogleDriveStorageError } from "@/modules/storage/infrastructure/google-drive/google-drive-storage-error";
import { VISIBLE_DRIVE_FOLDER_NAME } from "@/modules/storage/shared/visible-drive-folder-name";

import { GoogleDriveMonthlyExpenseReceiptsRepository } from "./google-drive-monthly-expense-receipts-repository";

function createDriveClientMock() {
  const files = {
    create: jest.fn(),
    list: jest.fn(),
  };
  const permissions = {
    create: jest.fn(),
  };

  return {
    driveClient: {
      files,
      permissions,
    } as unknown as drive_v3.Drive,
    files,
    permissions,
  };
}

describe("GoogleDriveMonthlyExpenseReceiptsRepository", () => {
  it("uploads a receipt file and sets public read permission", async () => {
    const { driveClient, files, permissions } = createDriveClientMock();

    files.list
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "root-folder-id",
              name: VISIBLE_DRIVE_FOLDER_NAME,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "expense-folder-id",
              name: "Internet",
            },
          ],
        },
      });
    files.create.mockResolvedValueOnce({
      data: {
        id: "receipt-file-id",
        name: "factura-internet.pdf",
        webViewLink: "https://drive.google.com/file/d/receipt-file-id/view",
      },
    });
    permissions.create.mockResolvedValueOnce({
      data: {
        id: "permission-id",
      },
    });

    const repository = new GoogleDriveMonthlyExpenseReceiptsRepository(driveClient);

    const result = await repository.saveReceipt({
      contentBytes: Uint8Array.from([1, 2, 3]),
      expenseDescription: "Internet",
      fileName: "factura-internet.pdf",
      mimeType: "application/pdf",
    });

    expect(files.create).toHaveBeenCalledWith(
      expect.objectContaining({
        media: expect.objectContaining({
          body: expect.objectContaining({
            pipe: expect.any(Function),
          }),
          mimeType: "application/pdf",
        }),
        requestBody: {
          name: "factura-internet.pdf",
          parents: ["expense-folder-id"],
        },
      }),
    );
    expect(permissions.create).toHaveBeenCalledWith({
      fields: "id",
      fileId: "receipt-file-id",
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    expect(result).toEqual({
      fileId: "receipt-file-id",
      fileName: "factura-internet.pdf",
      fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
      folderId: "expense-folder-id",
      folderViewUrl: "https://drive.google.com/drive/folders/expense-folder-id",
    });
  });

  it("keeps the upload when public sharing permission is blocked", async () => {
    const { driveClient, files, permissions } = createDriveClientMock();

    files.list
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "root-folder-id",
              name: VISIBLE_DRIVE_FOLDER_NAME,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "expense-folder-id",
              name: "Internet",
            },
          ],
        },
      });
    files.create.mockResolvedValueOnce({
      data: {
        id: "receipt-file-id",
        name: "factura-internet.pdf",
      },
    });
    permissions.create.mockRejectedValueOnce(
      new GoogleDriveStorageError(
        "permissions denied",
        {
          code: "insufficient_permissions",
          endpoint: "drive.permissions.create",
          operation: "google-drive-monthly-expense-receipts-repository:test",
        },
      ),
    );

    const repository = new GoogleDriveMonthlyExpenseReceiptsRepository(driveClient);

    await expect(
      repository.saveReceipt({
        contentBytes: Uint8Array.from([1, 2, 3]),
        expenseDescription: "Internet",
        fileName: "factura-internet.pdf",
        mimeType: "application/pdf",
      }),
    ).resolves.toEqual({
      fileId: "receipt-file-id",
      fileName: "factura-internet.pdf",
      fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
      folderId: "expense-folder-id",
      folderViewUrl: "https://drive.google.com/drive/folders/expense-folder-id",
    });
  });

  it("keeps the upload when public sharing returns a 400 validation error", async () => {
    const { driveClient, files, permissions } = createDriveClientMock();

    files.list
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "root-folder-id",
              name: VISIBLE_DRIVE_FOLDER_NAME,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "expense-folder-id",
              name: "Internet",
            },
          ],
        },
      });
    files.create.mockResolvedValueOnce({
      data: {
        id: "receipt-file-id",
        name: "factura-internet.pdf",
      },
    });
    permissions.create.mockRejectedValueOnce(
      new GoogleDriveStorageError("permission validation failed", {
        code: "invalid_payload",
        endpoint: "drive.permissions.create",
        operation: "google-drive-monthly-expense-receipts-repository:test",
      }),
    );

    const repository = new GoogleDriveMonthlyExpenseReceiptsRepository(driveClient);

    await expect(
      repository.saveReceipt({
        contentBytes: Uint8Array.from([1, 2, 3]),
        expenseDescription: "Internet",
        fileName: "factura-internet.pdf",
        mimeType: "application/pdf",
      }),
    ).resolves.toEqual({
      fileId: "receipt-file-id",
      fileName: "factura-internet.pdf",
      fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
      folderId: "expense-folder-id",
      folderViewUrl: "https://drive.google.com/drive/folders/expense-folder-id",
    });
  });
});
