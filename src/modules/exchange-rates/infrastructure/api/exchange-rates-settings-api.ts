import { z } from "zod";

import { withCorrelationIdHeaders } from "@/modules/shared/infrastructure/observability/client-correlation-id";

const exchangeRateSettingsRequestSchema = z.object({
  iibbRateDecimal: z.number(),
});

const exchangeRateSettingsResultSchema = z.object({
  data: z.object({
    iibbRateDecimal: z.number(),
  }),
});

const exchangeRateSettingsErrorEnvelopeSchema = z.object({
  error: z.string().trim().min(1),
});

export class ExchangeRateSettingsApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ExchangeRateSettingsApiError";
  }
}

export async function saveGlobalExchangeRateSettingsViaApi(
  payload: z.infer<typeof exchangeRateSettingsRequestSchema>,
  fetchImplementation: typeof fetch = fetch,
): Promise<z.infer<typeof exchangeRateSettingsResultSchema>["data"]> {
  const normalizedPayload = exchangeRateSettingsRequestSchema.parse(payload);
  const response = await fetchImplementation("/api/exchange-rates/settings", {
    body: JSON.stringify(normalizedPayload),
    headers: withCorrelationIdHeaders({
      "Content-Type": "application/json",
    }),
    method: "POST",
  });
  const responseJson = await response.json();

  if (!response.ok) {
    const parsedError =
      exchangeRateSettingsErrorEnvelopeSchema.safeParse(responseJson);

    throw new ExchangeRateSettingsApiError(
      parsedError.success
        ? parsedError.data.error
        : "exchange-rates-settings-api:/api/exchange-rates/settings returned an unexpected error response.",
    );
  }

  return exchangeRateSettingsResultSchema.parse(responseJson).data;
}
