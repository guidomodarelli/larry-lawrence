import type { ExchangeRatesRepository } from "../../domain/repositories/exchange-rates-repository";
import type { GlobalExchangeRateSettingsRepository } from "../../domain/repositories/global-exchange-rate-settings-repository";

import type { ExchangeRatesPageResult } from "../results/exchange-rates-page-result";

export const DEFAULT_IIBB_RATE_DECIMAL = 0.02;
export const SOLIDARITY_RATE_IVA_DECIMAL = 0.21;

export function calculateSolidarityRate(
  officialRate: number,
  iibbRateDecimal: number,
): number {
  return officialRate * (1 + iibbRateDecimal + SOLIDARITY_RATE_IVA_DECIMAL);
}

export async function getExchangeRatesPageResult({
  canEditIibb,
  exchangeRatesRepository,
  settingsRepository,
}: {
  canEditIibb: boolean;
  exchangeRatesRepository: ExchangeRatesRepository;
  settingsRepository: GlobalExchangeRateSettingsRepository;
}): Promise<ExchangeRatesPageResult> {
  const [officialRate, blueRate, persistedSettings] = await Promise.all([
    exchangeRatesRepository.getRate("official"),
    exchangeRatesRepository.getRate("blue"),
    settingsRepository.get(),
  ]);
  const iibbRateDecimal =
    persistedSettings?.iibbRateDecimal ?? DEFAULT_IIBB_RATE_DECIMAL;

  return {
    blueRate,
    canEditIibb,
    iibbRateDecimal,
    loadError: null,
    officialRate,
    solidarityRate: calculateSolidarityRate(officialRate, iibbRateDecimal),
  };
}
