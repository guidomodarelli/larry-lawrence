export interface ExchangeRatesPageResult {
  blueRate: number;
  canEditIibb: boolean;
  iibbRateDecimal: number;
  loadError: string | null;
  maxSelectableMonth: string;
  minSelectableMonth: string;
  officialRate: number;
  selectedMonth: string;
  solidarityRate: number;
}
