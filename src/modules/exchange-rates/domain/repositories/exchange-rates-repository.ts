export type ExchangeRateVariant = "official" | "blue";

export interface MonthlyExchangeRateValue {
  month: string;
  rate: number;
  sourceDateIso: string;
  variant: ExchangeRateVariant;
}

export interface ExchangeRatesRepository {
  getMonthlyRate(query: {
    month: string;
    variant: ExchangeRateVariant;
  }): Promise<MonthlyExchangeRateValue>;
}
