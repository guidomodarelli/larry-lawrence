import type { GlobalExchangeRateSettings } from "../entities/global-exchange-rate-settings";

export interface GlobalExchangeRateSettingsRepository {
  get(): Promise<GlobalExchangeRateSettings | null>;
  save(iibbRateDecimal: number): Promise<GlobalExchangeRateSettings>;
}
