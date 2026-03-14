const MAX_IIBB_RATE_DECIMAL = 1;

export function createIibbRateDecimal(
  value: number,
  operationName: string,
): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${operationName} requires a finite IIBB decimal value.`);
  }

  if (value < 0) {
    throw new Error(`${operationName} requires a non-negative IIBB decimal value.`);
  }

  if (value >= MAX_IIBB_RATE_DECIMAL) {
    throw new Error(
      `${operationName} requires an IIBB decimal value lower than 1.`,
    );
  }

  return value;
}
