import type { MonthlyExchangeRateSnapshot } from "../entities/monthly-exchange-rate-snapshot";

export interface MonthlyExchangeRateSnapshotsRepository {
  getByMonth(month: string): Promise<MonthlyExchangeRateSnapshot | null>;
  save(
    snapshot: MonthlyExchangeRateSnapshot,
  ): Promise<MonthlyExchangeRateSnapshot>;
}
