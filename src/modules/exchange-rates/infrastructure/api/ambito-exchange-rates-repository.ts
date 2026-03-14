import type {
  ExchangeRateVariant,
  ExchangeRatesRepository,
} from "../../domain/repositories/exchange-rates-repository";

import { mapAmbitoDollarRateDtoToRate } from "./mapper";

const AMBITO_VARIANT_BY_DOMAIN_VARIANT: Record<ExchangeRateVariant, string> = {
  blue: "informal",
  official: "oficial",
};
const AMBITO_REQUEST_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "es-419,es;q=0.9",
  "Cache-Control": "max-age=0",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
} as const;

export class AmbitoExchangeRatesRepository implements ExchangeRatesRepository {
  constructor(
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async getRate(variant: ExchangeRateVariant): Promise<number> {
    const endpointVariant = AMBITO_VARIANT_BY_DOMAIN_VARIANT[variant];
    const response = await this.fetchImplementation(
      `https://mercados.ambito.com/dolar/${endpointVariant}/variacion`,
      {
        headers: AMBITO_REQUEST_HEADERS,
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(
        `ambito-exchange-rates-repository:getRate received ${response.status} for ${variant}.`,
      );
    }

    return mapAmbitoDollarRateDtoToRate(await response.json());
  }
}
