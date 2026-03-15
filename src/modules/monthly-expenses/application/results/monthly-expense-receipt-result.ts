import type { MonthlyExpenseReceiptUpload } from "../../domain/repositories/monthly-expense-receipts-repository";

export interface MonthlyExpenseReceiptResult {
  fileId: string;
  fileName: string;
  fileViewUrl: string;
  folderId: string;
  folderViewUrl: string;
}

export function toMonthlyExpenseReceiptResult(
  upload: MonthlyExpenseReceiptUpload,
): MonthlyExpenseReceiptResult {
  return {
    fileId: upload.fileId,
    fileName: upload.fileName,
    fileViewUrl: upload.fileViewUrl,
    folderId: upload.folderId,
    folderViewUrl: upload.folderViewUrl,
  };
}
