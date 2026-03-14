const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const MONTHLY_EXPENSE_CURRENCIES = ["ARS", "USD"] as const;

export type MonthlyExpenseCurrency =
  (typeof MONTHLY_EXPENSE_CURRENCIES)[number];

export interface MonthlyExpenseLoanInput {
  installmentCount: number;
  lenderId?: string;
  lenderName?: string;
  startMonth: string;
}

export interface MonthlyExpenseLoan extends MonthlyExpenseLoanInput {
  endMonth: string;
  paidInstallments: number;
}

export interface MonthlyExpenseItemInput {
  currency: MonthlyExpenseCurrency;
  description: string;
  id: string;
  loan?: MonthlyExpenseLoanInput;
  occurrencesPerMonth: number;
  subtotal: number;
}

export interface MonthlyExpenseItem extends MonthlyExpenseItemInput {
  loan?: MonthlyExpenseLoan;
  total: number;
}

export interface MonthlyExpensesExchangeRateSnapshotInput {
  blueRate: number;
  month: string;
  officialRate: number;
  solidarityRate: number;
}

export type MonthlyExpensesExchangeRateSnapshot =
  MonthlyExpensesExchangeRateSnapshotInput;

export interface MonthlyExpensesDocumentInput {
  exchangeRateSnapshot?: MonthlyExpensesExchangeRateSnapshotInput;
  items: MonthlyExpenseItemInput[];
  month: string;
}

export interface MonthlyExpensesDocument {
  exchangeRateSnapshot?: MonthlyExpensesExchangeRateSnapshot | null;
  items: MonthlyExpenseItem[];
  month: string;
}

export function calculateMonthlyExpenseTotal({
  occurrencesPerMonth,
  subtotal,
}: {
  occurrencesPerMonth: number;
  subtotal: number;
}): number {
  return Number((subtotal * occurrencesPerMonth).toFixed(2));
}

function parseMonthIdentifier(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    monthIndex: year * 12 + (monthNumber - 1),
    normalizedMonth: `${year}-${String(monthNumber).padStart(2, "0")}`,
  };
}

function formatMonthFromIndex(monthIndex: number): string {
  const year = Math.floor(monthIndex / 12);
  const monthNumber = (monthIndex % 12) + 1;

  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

function isValidCurrency(currency: string): currency is MonthlyExpenseCurrency {
  return MONTHLY_EXPENSE_CURRENCIES.includes(
    currency as MonthlyExpenseCurrency,
  );
}

function validateMonth(
  month: string,
  operationName: string,
  fieldName: string = "a month",
): string {
  const normalizedMonth = month.trim();

  if (!MONTH_PATTERN.test(normalizedMonth)) {
    throw new Error(
      `${operationName} requires ${fieldName} in YYYY-MM format.`,
    );
  }

  return normalizedMonth;
}

function validatePositiveInteger(
  value: number,
  operationName: string,
  fieldName: string,
): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${operationName} requires ${fieldName} greater than 0.`);
  }

  return value;
}

export function calculateLoanEndMonth({
  installmentCount,
  startMonth,
}: MonthlyExpenseLoanInput): string {
  const normalizedStartMonth = validateMonth(
    startMonth,
    "Calculating the loan end month",
  );
  const normalizedInstallmentCount = validatePositiveInteger(
    installmentCount,
    "Calculating the loan end month",
    "an installment count",
  );
  const { monthIndex } = parseMonthIdentifier(normalizedStartMonth);

  return formatMonthFromIndex(monthIndex + normalizedInstallmentCount - 1);
}

export function calculatePaidLoanInstallments({
  installmentCount,
  startMonth,
  targetMonth,
}: MonthlyExpenseLoanInput & {
  targetMonth: string;
}): number {
  const normalizedStartMonth = validateMonth(
    startMonth,
    "Calculating paid loan installments",
  );
  const normalizedTargetMonth = validateMonth(
    targetMonth,
    "Calculating paid loan installments",
  );
  const normalizedInstallmentCount = validatePositiveInteger(
    installmentCount,
    "Calculating paid loan installments",
    "an installment count",
  );
  const { monthIndex: startMonthIndex } = parseMonthIdentifier(
    normalizedStartMonth,
  );
  const { monthIndex: targetMonthIndex } = parseMonthIdentifier(
    normalizedTargetMonth,
  );

  if (targetMonthIndex < startMonthIndex) {
    return 0;
  }

  return Math.min(
    targetMonthIndex - startMonthIndex + 1,
    normalizedInstallmentCount,
  );
}

function validateLoan(
  loan: MonthlyExpenseLoanInput,
  operationName: string,
  targetMonth: string,
): MonthlyExpenseLoan {
  const startMonth = validateMonth(
    loan.startMonth,
    operationName,
    "a loan start month",
  );
  const installmentCount = validatePositiveInteger(
    loan.installmentCount,
    operationName,
    "a loan installment count",
  );
  const lenderName = loan.lenderName?.trim();
  const lenderId = loan.lenderId?.trim();

  return {
    ...(lenderId ? { lenderId } : {}),
    ...(lenderName ? { lenderName } : {}),
    endMonth: calculateLoanEndMonth({
      installmentCount,
      startMonth,
    }),
    installmentCount,
    paidInstallments: calculatePaidLoanInstallments({
      installmentCount,
      startMonth,
      targetMonth,
    }),
    startMonth,
  };
}

function validateItem(
  item: MonthlyExpenseItemInput,
  operationName: string,
  targetMonth: string,
): MonthlyExpenseItem {
  const { loan, ...rawItem } = item;
  const normalizedItem = {
    ...rawItem,
    description: item.description.trim(),
    id: item.id.trim(),
  };

  if (!normalizedItem.id) {
    throw new Error(
      `${operationName} requires every expense to include an internal id.`,
    );
  }

  if (!isValidCurrency(normalizedItem.currency)) {
    throw new Error(
      `${operationName} requires every expense to use ARS or USD currency.`,
    );
  }

  if (
    !normalizedItem.description ||
    !Number.isFinite(normalizedItem.subtotal) ||
    normalizedItem.subtotal <= 0 ||
    !Number.isInteger(normalizedItem.occurrencesPerMonth) ||
    normalizedItem.occurrencesPerMonth <= 0
  ) {
    throw new Error(
      `${operationName} requires every expense to include a description, a subtotal greater than 0, and occurrences per month greater than 0.`,
    );
  }

  return {
    ...normalizedItem,
    ...(loan ? { loan: validateLoan(loan, operationName, targetMonth) } : {}),
    total: calculateMonthlyExpenseTotal(normalizedItem),
  };
}

function validateExchangeRateSnapshot(
  exchangeRateSnapshot: MonthlyExpensesExchangeRateSnapshotInput,
  operationName: string,
  targetMonth: string,
): MonthlyExpensesExchangeRateSnapshot {
  const month = validateMonth(
    exchangeRateSnapshot.month,
    operationName,
    "an exchange rate snapshot month",
  );

  if (month !== targetMonth) {
    throw new Error(
      `${operationName} requires the exchange rate snapshot month to match the document month.`,
    );
  }

  const numericRates = [
    exchangeRateSnapshot.officialRate,
    exchangeRateSnapshot.blueRate,
    exchangeRateSnapshot.solidarityRate,
  ];

  if (numericRates.some((rate) => !Number.isFinite(rate) || rate <= 0)) {
    throw new Error(
      `${operationName} requires exchange rate snapshot values greater than 0.`,
    );
  }

  return {
    blueRate: exchangeRateSnapshot.blueRate,
    month,
    officialRate: exchangeRateSnapshot.officialRate,
    solidarityRate: exchangeRateSnapshot.solidarityRate,
  };
}

export function createMonthlyExpensesDocument(
  payload: MonthlyExpensesDocumentInput,
  operationName: string,
): MonthlyExpensesDocument {
  const month = validateMonth(payload.month, operationName);

  return {
    ...(payload.exchangeRateSnapshot
      ? {
          exchangeRateSnapshot: validateExchangeRateSnapshot(
            payload.exchangeRateSnapshot,
            operationName,
            month,
          ),
        }
      : {}),
    items: payload.items.map((item) => validateItem(item, operationName, month)),
    month,
  };
}

export function createEmptyMonthlyExpensesDocument(
  month: string,
): MonthlyExpensesDocument {
  return createMonthlyExpensesDocument(
    {
      items: [],
      month,
    },
    "Creating an empty monthly expenses document",
  );
}

export function toMonthlyExpensesDocumentInput(
  document: MonthlyExpensesDocument,
): MonthlyExpensesDocumentInput {
  return {
    ...(document.exchangeRateSnapshot
      ? {
          exchangeRateSnapshot: {
            blueRate: document.exchangeRateSnapshot.blueRate,
            month: document.exchangeRateSnapshot.month,
            officialRate: document.exchangeRateSnapshot.officialRate,
            solidarityRate: document.exchangeRateSnapshot.solidarityRate,
          },
        }
      : {}),
    items: document.items.map((item) => ({
      currency: item.currency,
      description: item.description,
      id: item.id,
      ...(item.loan
        ? {
            loan: {
              installmentCount: item.loan.installmentCount,
              ...(item.loan.lenderId ? { lenderId: item.loan.lenderId } : {}),
              ...(item.loan.lenderName
                ? { lenderName: item.loan.lenderName }
                : {}),
              startMonth: item.loan.startMonth,
            },
          }
        : {}),
      occurrencesPerMonth: item.occurrencesPerMonth,
      subtotal: item.subtotal,
    })),
    month: document.month,
  };
}
