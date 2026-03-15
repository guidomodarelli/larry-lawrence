export interface MonthlyExpenseReceiptUploadInput {
  contentBytes: Uint8Array;
  expenseDescription: string;
  fileName: string;
  mimeType: string;
}

export interface MonthlyExpenseReceiptUpload {
  fileId: string;
  fileName: string;
  fileViewUrl: string;
  folderId: string;
  folderViewUrl: string;
}

export interface RenameMonthlyExpenseReceiptFolderInput {
  folderId: string;
  nextDescription: string;
}

export interface MonthlyExpenseReceiptsRepository {
  renameExpenseFolder(
    input: RenameMonthlyExpenseReceiptFolderInput,
  ): Promise<void>;
  saveReceipt(
    input: MonthlyExpenseReceiptUploadInput,
  ): Promise<MonthlyExpenseReceiptUpload>;
}
