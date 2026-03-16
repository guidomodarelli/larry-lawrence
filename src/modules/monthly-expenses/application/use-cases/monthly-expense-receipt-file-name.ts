const RECEIPT_FILE_NAME_DATE_PREFIX_PATTERN =
  /^(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])) - /;

function toReceiptFileNameDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getOriginalFileExtension(fileName: string): string {
  const normalizedFileName = fileName.trim();
  const lastDotIndex = normalizedFileName.lastIndexOf(".");

  if (
    lastDotIndex <= 0 ||
    lastDotIndex === normalizedFileName.length - 1
  ) {
    return "";
  }

  return normalizedFileName.slice(lastDotIndex);
}

export function getReceiptFileNameDatePrefix(
  fileName: string,
): string | null {
  const normalizedFileName = fileName.trim();
  const matchedDatePrefix = normalizedFileName.match(
    RECEIPT_FILE_NAME_DATE_PREFIX_PATTERN,
  );

  return matchedDatePrefix?.[1] ?? null;
}

export function buildMonthlyExpenseReceiptFileName({
  coveredPayments,
  date,
  expenseDescription,
  originalFileName,
  preferredDatePrefix,
}: {
  coveredPayments: number;
  date: Date;
  expenseDescription: string;
  originalFileName: string;
  preferredDatePrefix?: string;
}): string {
  const extension = getOriginalFileExtension(originalFileName);
  const datePrefix = preferredDatePrefix ?? toReceiptFileNameDate(date);

  return `${datePrefix} - ${expenseDescription} - cubre ${coveredPayments} pagos${extension}`;
}
