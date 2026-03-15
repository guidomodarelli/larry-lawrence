export class MonthlyExpenseReceiptFolderConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonthlyExpenseReceiptFolderConflictError";
  }
}
