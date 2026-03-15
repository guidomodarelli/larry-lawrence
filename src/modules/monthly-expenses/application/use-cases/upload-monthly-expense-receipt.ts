import type { UploadMonthlyExpenseReceiptCommand } from "../commands/upload-monthly-expense-receipt-command";
import {
  toMonthlyExpenseReceiptResult,
  type MonthlyExpenseReceiptResult,
} from "../results/monthly-expense-receipt-result";
import type { MonthlyExpenseReceiptsRepository } from "../../domain/repositories/monthly-expense-receipts-repository";

const MAX_RECEIPT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  "application/pdf",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function decodeBase64Content(contentBase64: string): Uint8Array {
  try {
    const binaryContent = globalThis.atob(contentBase64);
    const contentBytes = new Uint8Array(binaryContent.length);

    for (let index = 0; index < binaryContent.length; index += 1) {
      contentBytes[index] = binaryContent.charCodeAt(index);
    }

    return contentBytes;
  } catch {
    throw new Error("Monthly expense receipts require a valid base64 file payload.");
  }
}

function validateReceiptCommand(
  command: UploadMonthlyExpenseReceiptCommand,
): {
  contentBytes: Uint8Array;
  expenseDescription: string;
  fileName: string;
  mimeType: string;
} {
  const normalizedCommand = {
    contentBase64: command.contentBase64.trim(),
    expenseDescription: command.expenseDescription.trim(),
    fileName: command.fileName.trim(),
    mimeType: command.mimeType.trim().toLowerCase(),
  };

  if (!normalizedCommand.expenseDescription) {
    throw new Error(
      "Monthly expense receipts require a non-empty expense description.",
    );
  }

  if (!normalizedCommand.fileName) {
    throw new Error("Monthly expense receipts require a non-empty file name.");
  }

  if (!ALLOWED_RECEIPT_MIME_TYPES.has(normalizedCommand.mimeType)) {
    throw new Error(
      "Monthly expense receipts only support PDF, JPG, PNG, WEBP, HEIC, and HEIF files.",
    );
  }

  if (!normalizedCommand.contentBase64) {
    throw new Error("Monthly expense receipts require file content.");
  }

  const contentBytes = decodeBase64Content(normalizedCommand.contentBase64);

  if (contentBytes.byteLength <= 0) {
    throw new Error("Monthly expense receipts require non-empty file content.");
  }

  if (contentBytes.byteLength > MAX_RECEIPT_FILE_SIZE_BYTES) {
    throw new Error("Monthly expense receipts support files up to 5MB.");
  }

  return {
    contentBytes,
    expenseDescription: normalizedCommand.expenseDescription,
    fileName: normalizedCommand.fileName,
    mimeType: normalizedCommand.mimeType,
  };
}

interface UploadMonthlyExpenseReceiptDependencies {
  command: UploadMonthlyExpenseReceiptCommand;
  repository: MonthlyExpenseReceiptsRepository;
}

export async function uploadMonthlyExpenseReceipt({
  command,
  repository,
}: UploadMonthlyExpenseReceiptDependencies): Promise<MonthlyExpenseReceiptResult> {
  const validatedCommand = validateReceiptCommand(command);

  return toMonthlyExpenseReceiptResult(
    await repository.saveReceipt(validatedCommand),
  );
}
