export interface MonthlyExchangeRateSnapshot {
  blueRate: number;
  iibbRateDecimalUsed: number;
  month: string;
  officialRate: number;
  solidarityRate: number;
  source: string;
  sourceDateIso: string;
  updatedAtIso: string;
}
