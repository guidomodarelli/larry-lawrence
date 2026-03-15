import type { MonthlyExpenseReceiptsRepository } from "../../domain/repositories/monthly-expense-receipts-repository";
import { uploadMonthlyExpenseReceipt } from "./upload-monthly-expense-receipt";

describe("uploadMonthlyExpenseReceipt", () => {
  it("validates and delegates receipt upload to the repository", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      renameExpenseFolder: jest.fn(),
      saveReceipt: jest.fn().mockResolvedValue({
        fileId: "receipt-file-id",
        fileName: "comprobante.pdf",
        fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
        folderId: "receipt-folder-id",
        folderViewUrl: "https://drive.google.com/drive/folders/receipt-folder-id",
      }),
    };

    const result = await uploadMonthlyExpenseReceipt({
      command: {
        contentBase64: "dGVzdA==",
        expenseDescription: "Internet",
        fileName: "comprobante.pdf",
        mimeType: "application/pdf",
      },
      repository,
    });

    expect(repository.saveReceipt).toHaveBeenCalled();
    expect(result).toEqual({
      fileId: "receipt-file-id",
      fileName: "comprobante.pdf",
      fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
      folderId: "receipt-folder-id",
      folderViewUrl: "https://drive.google.com/drive/folders/receipt-folder-id",
    });
  });

  it("rejects files larger than 5MB", async () => {
    const repository: MonthlyExpenseReceiptsRepository = {
      renameExpenseFolder: jest.fn(),
      saveReceipt: jest.fn(),
    };
    const oversizedContent = Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64");

    await expect(
      uploadMonthlyExpenseReceipt({
        command: {
          contentBase64: oversizedContent,
          expenseDescription: "Internet",
          fileName: "comprobante.pdf",
          mimeType: "application/pdf",
        },
        repository,
      }),
    ).rejects.toThrow("Monthly expense receipts support files up to 5MB.");
  });
});
