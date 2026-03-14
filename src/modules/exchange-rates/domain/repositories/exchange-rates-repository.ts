export type ExchangeRateVariant = "official" | "blue";

export interface ExchangeRatesRepository {
  getRate(variant: ExchangeRateVariant): Promise<number>;
}
