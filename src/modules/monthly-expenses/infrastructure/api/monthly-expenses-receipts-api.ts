import { z } from "zod";

import { withCorrelationIdHeaders } from "@/modules/shared/infrastructure/observability/client-correlation-id";

const uploadMonthlyExpenseReceiptRequestSchema = z.object({
  contentBase64: z.string().trim().min(1),
  expenseDescription: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
});

const monthlyExpenseReceiptResultSchema = z.object({
  fileId: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  fileViewUrl: z.string().trim().url(),
  folderId: z.string().trim().min(1),
  folderViewUrl: z.string().trim().url(),
});

const monthlyExpenseReceiptSuccessEnvelopeSchema = z.object({
  data: monthlyExpenseReceiptResultSchema,
});

const monthlyExpenseReceiptErrorEnvelopeSchema = z.object({
  error: z.string().trim().min(1),
});

export type UploadMonthlyExpenseReceiptRequest = z.infer<
  typeof uploadMonthlyExpenseReceiptRequestSchema
>;
export type MonthlyExpenseReceiptResult = z.infer<
  typeof monthlyExpenseReceiptResultSchema
>;

export class MonthlyExpenseReceiptsApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MonthlyExpenseReceiptsApiError";
  }
}

export async function uploadMonthlyExpenseReceiptViaApi(
  payload: UploadMonthlyExpenseReceiptRequest,
  fetchImplementation: typeof fetch = fetch,
): Promise<MonthlyExpenseReceiptResult> {
  const normalizedPayload = uploadMonthlyExpenseReceiptRequestSchema.parse(payload);
  const response = await fetchImplementation("/api/storage/monthly-expenses-receipts", {
    body: JSON.stringify(normalizedPayload),
    headers: withCorrelationIdHeaders({
      "Content-Type": "application/json",
    }),
    method: "POST",
  });
  const responseJson = await response.json();

  if (!response.ok) {
    const parsedError = monthlyExpenseReceiptErrorEnvelopeSchema.safeParse(
      responseJson,
    );

    throw new MonthlyExpenseReceiptsApiError(
      parsedError.success
        ? parsedError.data.error
        : "monthly-expenses-receipts-api:/api/storage/monthly-expenses-receipts returned an unexpected error response.",
    );
  }

  return monthlyExpenseReceiptSuccessEnvelopeSchema.parse(responseJson).data;
}
