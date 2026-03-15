export interface UploadMonthlyExpenseReceiptCommand {
  contentBase64: string;
  expenseDescription: string;
  fileName: string;
  mimeType: string;
}
