import type { GlobalExchangeRateSettingsRepository } from "../../domain/repositories/global-exchange-rate-settings-repository";
import type { MonthlyExchangeRateSnapshot } from "../../domain/entities/monthly-exchange-rate-snapshot";
import type { ExchangeRatesRepository } from "../../domain/repositories/exchange-rates-repository";
import type { MonthlyExchangeRateSnapshotsRepository } from "../../domain/repositories/monthly-exchange-rate-snapshots-repository";

export const DEFAULT_IIBB_RATE_DECIMAL = 0.02;
export const SOLIDARITY_RATE_IVA_DECIMAL = 0.21;
const AMBITO_HISTORICAL_SOURCE = "ambito-historico-general";

export function calculateSolidarityRate(
  officialRate: number,
  iibbRateDecimal: number,
): number {
  return officialRate * (1 + iibbRateDecimal + SOLIDARITY_RATE_IVA_DECIMAL);
}

function createSnapshotFromRates({
  blueRate,
  iibbRateDecimalUsed,
  month,
  now,
  officialRate,
  sourceDateIso,
}: {
  blueRate: number;
  iibbRateDecimalUsed: number;
  month: string;
  now: Date;
  officialRate: number;
  sourceDateIso: string;
}): MonthlyExchangeRateSnapshot {
  return {
    blueRate,
    iibbRateDecimalUsed,
    month,
    officialRate,
    solidarityRate: calculateSolidarityRate(officialRate, iibbRateDecimalUsed),
    source: AMBITO_HISTORICAL_SOURCE,
    sourceDateIso,
    updatedAtIso: now.toISOString(),
  };
}

export async function getMonthlyExchangeRateSnapshot({
  exchangeRatesRepository,
  month,
  monthlyExchangeRateSnapshotsRepository,
  now = () => new Date(),
  settingsRepository,
}: {
  exchangeRatesRepository: ExchangeRatesRepository;
  month: string;
  monthlyExchangeRateSnapshotsRepository: MonthlyExchangeRateSnapshotsRepository;
  now?: () => Date;
  settingsRepository: GlobalExchangeRateSettingsRepository;
}): Promise<MonthlyExchangeRateSnapshot> {
  const [cachedSnapshot, persistedSettings] = await Promise.all([
    monthlyExchangeRateSnapshotsRepository.getByMonth(month),
    settingsRepository.get(),
  ]);
  const iibbRateDecimal =
    persistedSettings?.iibbRateDecimal ?? DEFAULT_IIBB_RATE_DECIMAL;

  if (cachedSnapshot) {
    if (cachedSnapshot.iibbRateDecimalUsed === iibbRateDecimal) {
      return cachedSnapshot;
    }

    return monthlyExchangeRateSnapshotsRepository.save(
      createSnapshotFromRates({
        blueRate: cachedSnapshot.blueRate,
        iibbRateDecimalUsed: iibbRateDecimal,
        month,
        now: now(),
        officialRate: cachedSnapshot.officialRate,
        sourceDateIso: cachedSnapshot.sourceDateIso,
      }),
    );
  }

  const [officialRate, blueRate] = await Promise.all([
    exchangeRatesRepository.getMonthlyRate({
      month,
      variant: "official",
    }),
    exchangeRatesRepository.getMonthlyRate({
      month,
      variant: "blue",
    }),
  ]);

  return monthlyExchangeRateSnapshotsRepository.save(
    createSnapshotFromRates({
      blueRate: blueRate.rate,
      iibbRateDecimalUsed: iibbRateDecimal,
      month,
      now: now(),
      officialRate: officialRate.rate,
      sourceDateIso:
        officialRate.sourceDateIso >= blueRate.sourceDateIso
          ? officialRate.sourceDateIso
          : blueRate.sourceDateIso,
    }),
  );
}
