import type { MonthlyExpenseReceiptsRepository } from "../../domain/repositories/monthly-expense-receipts-repository";
import { uploadMonthlyExpenseReceipt } from "./upload-monthly-expense-receipt";

describe("uploadMonthlyExpenseReceipt", () => {
  it("validates and delegates receipt upload to the repository", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      deleteReceipt: jest.fn(),
      renameExpenseFolder: jest.fn(),
      renameReceiptFile: jest.fn(),
      saveReceipt: jest.fn().mockResolvedValue({
        allReceiptsFolderId: "all-receipts-folder-id",
        allReceiptsFolderViewUrl:
          "https://drive.google.com/drive/folders/all-receipts-folder-id",
        coveredPayments: 2,
        fileId: "receipt-file-id",
        fileName: "comprobante.pdf",
        fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
        monthlyFolderId: "receipt-folder-id",
        monthlyFolderViewUrl:
          "https://drive.google.com/drive/folders/receipt-folder-id",
      }),
        verifyFolders: jest.fn(),
      verifyReceipt: jest.fn(),
    };

    const result = await uploadMonthlyExpenseReceipt({
      command: {
        contentBase64: "dGVzdA==",
        coveredPayments: 2,
        expenseDescription: "Internet",
        fileName: "comprobante.pdf",
        month: "2026-03",
        mimeType: "application/pdf",
      },
      repository,
    });

    expect(repository.saveReceipt).toHaveBeenCalled();
    expect(repository.saveReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        coveredPayments: 2,
      }),
    );
    expect(result).toEqual({
      allReceiptsFolderId: "all-receipts-folder-id",
      allReceiptsFolderViewUrl:
        "https://drive.google.com/drive/folders/all-receipts-folder-id",
      coveredPayments: 2,
      fileId: "receipt-file-id",
      fileName: "comprobante.pdf",
      fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
      monthlyFolderId: "receipt-folder-id",
      monthlyFolderViewUrl: "https://drive.google.com/drive/folders/receipt-folder-id",
    });
  });

  it("rejects files larger than 5MB", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      deleteReceipt: jest.fn(),
      renameExpenseFolder: jest.fn(),
      renameReceiptFile: jest.fn(),
      saveReceipt: jest.fn(),
      verifyFolders: jest.fn(),
      verifyReceipt: jest.fn(),
    };
    const oversizedContent = Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64");

    await expect(
      uploadMonthlyExpenseReceipt({
        command: {
          contentBase64: oversizedContent,
          coveredPayments: 1,
          expenseDescription: "Internet",
          fileName: "comprobante.pdf",
          month: "2026-03",
          mimeType: "application/pdf",
        },
        repository,
      }),
    ).rejects.toThrow("Monthly expense receipts support files up to 5MB.");
  });

  it("rejects coveredPayments that are not positive integers", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      deleteReceipt: jest.fn(),
      renameExpenseFolder: jest.fn(),
      renameReceiptFile: jest.fn(),
      saveReceipt: jest.fn(),
      verifyFolders: jest.fn(),
      verifyReceipt: jest.fn(),
    };

    await expect(
      uploadMonthlyExpenseReceipt({
        command: {
          contentBase64: "dGVzdA==",
          coveredPayments: 0,
          expenseDescription: "Internet",
          fileName: "comprobante.pdf",
          month: "2026-03",
          mimeType: "application/pdf",
        },
        repository,
      }),
    ).rejects.toThrow(
      "Monthly expense receipts require covered payments greater than 0.",
    );
  });

  it("formats receipt file name on upload preserving the original extension", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      deleteReceipt: jest.fn(),
      renameExpenseFolder: jest.fn(),
      renameReceiptFile: jest.fn(),
      saveReceipt: jest.fn().mockImplementation(async (input) => ({
        allReceiptsFolderId: "all-receipts-folder-id",
        allReceiptsFolderViewUrl:
          "https://drive.google.com/drive/folders/all-receipts-folder-id",
        coveredPayments: input.coveredPayments,
        fileId: "receipt-file-id",
        fileName: input.fileName,
        fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
        monthlyFolderId: "receipt-folder-id",
        monthlyFolderViewUrl:
          "https://drive.google.com/drive/folders/receipt-folder-id",
      })),
      verifyFolders: jest.fn(),
      verifyReceipt: jest.fn(),
    };

    const result = await uploadMonthlyExpenseReceipt({
      command: {
        contentBase64: "dGVzdA==",
        coveredPayments: 2,
        expenseDescription: "Alquiler departamento",
        fileName: "comprobante-original.PDF",
        month: "2026-03",
        mimeType: "application/pdf",
      },
      now: new Date("2026-03-16T12:10:00.000Z"),
      repository,
    });

    expect(repository.saveReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "2026-03-16 - Alquiler departamento - cubre 2 pagos.PDF",
      }),
    );
    expect(result.fileName).toBe(
      "2026-03-16 - Alquiler departamento - cubre 2 pagos.PDF",
    );
  });

  it("formats receipt file name on upload without adding an extension when missing", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      deleteReceipt: jest.fn(),
      renameExpenseFolder: jest.fn(),
      renameReceiptFile: jest.fn(),
      saveReceipt: jest.fn().mockImplementation(async (input) => ({
        allReceiptsFolderId: "all-receipts-folder-id",
        allReceiptsFolderViewUrl:
          "https://drive.google.com/drive/folders/all-receipts-folder-id",
        coveredPayments: input.coveredPayments,
        fileId: "receipt-file-id",
        fileName: input.fileName,
        fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
        monthlyFolderId: "receipt-folder-id",
        monthlyFolderViewUrl:
          "https://drive.google.com/drive/folders/receipt-folder-id",
      })),
      verifyFolders: jest.fn(),
      verifyReceipt: jest.fn(),
    };

    const result = await uploadMonthlyExpenseReceipt({
      command: {
        contentBase64: "dGVzdA==",
        coveredPayments: 1,
        expenseDescription: "Internet",
        fileName: "comprobante",
        month: "2026-03",
        mimeType: "application/pdf",
      },
      now: new Date("2026-03-16T12:10:00.000Z"),
      repository,
    });

    expect(repository.saveReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "2026-03-16 - Internet - cubre 1 pagos",
      }),
    );
    expect(result.fileName).toBe("2026-03-16 - Internet - cubre 1 pagos");
  });
});
