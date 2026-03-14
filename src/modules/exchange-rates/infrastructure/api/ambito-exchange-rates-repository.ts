import type {
  ExchangeRateVariant,
  ExchangeRatesRepository,
} from "../../domain/repositories/exchange-rates-repository";

import { mapAmbitoDollarHistoryDtoToMonthlyRate } from "./mapper";

const AMBITO_VARIANT_BY_DOMAIN_VARIANT: Record<ExchangeRateVariant, string> = {
  blue: "informal",
  official: "formal",
};
const AMBITO_REQUEST_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "es-419,es;q=0.9",
  "Cache-Control": "max-age=0",
  Priority: "u=0, i",
  "Sec-CH-UA":
    '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"macOS"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
} as const;

export class AmbitoExchangeRatesRepository implements ExchangeRatesRepository {
  constructor(
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async getMonthlyRate({
    month,
    variant,
  }: {
    month: string;
    variant: ExchangeRateVariant;
  }): Promise<{
    month: string;
    rate: number;
    sourceDateIso: string;
    variant: ExchangeRateVariant;
  }> {
    const endpointVariant = AMBITO_VARIANT_BY_DOMAIN_VARIANT[variant];
    const [yearValue, monthValue] = month.split("-").map(Number);
    const lastDayOfMonth = new Date(
      Date.UTC(yearValue, monthValue, 0),
    ).getUTCDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(lastDayOfMonth).padStart(2, "0")}`;
    const response = await this.fetchImplementation(
      `https://mercados.ambito.com/dolar/${endpointVariant}/historico-general/${startDate}/${endDate}`,
      {
        headers: AMBITO_REQUEST_HEADERS,
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(
        `ambito-exchange-rates-repository:getMonthlyRate received ${response.status} for ${variant} in ${month}.`,
      );
    }

    const mappedRate = mapAmbitoDollarHistoryDtoToMonthlyRate(
      await response.json(),
      month,
    );

    return {
      month,
      rate: mappedRate.rate,
      sourceDateIso: mappedRate.sourceDateIso,
      variant,
    };
  }
}
