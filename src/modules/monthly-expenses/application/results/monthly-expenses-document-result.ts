import type {
  MonthlyExpenseItem,
  MonthlyExpensesExchangeRateSnapshot,
  MonthlyExpensesDocument,
} from "../../domain/value-objects/monthly-expenses-document";
import { createEmptyMonthlyExpensesDocument } from "../../domain/value-objects/monthly-expenses-document";

export interface MonthlyExpensesDocumentResult
  extends MonthlyExpensesDocument {
  exchangeRateLoadError?: string | null;
  exchangeRateSnapshot?: MonthlyExpensesExchangeRateSnapshot | null;
  items: MonthlyExpenseItem[];
}

export function toMonthlyExpensesDocumentResult(
  document: MonthlyExpensesDocument,
  exchangeRateLoadError: string | null = null,
): MonthlyExpensesDocumentResult {
  return {
    exchangeRateLoadError,
    exchangeRateSnapshot: document.exchangeRateSnapshot
      ? { ...document.exchangeRateSnapshot }
      : null,
    items: document.items.map((item) => ({
      ...item,
      ...(item.loan ? { loan: { ...item.loan } } : {}),
      ...(item.receipt ? { receipt: { ...item.receipt } } : {}),
    })),
    month: document.month,
  };
}

export function createEmptyMonthlyExpensesDocumentResult(
  month: string,
): MonthlyExpensesDocumentResult {
  return toMonthlyExpensesDocumentResult(createEmptyMonthlyExpensesDocument(month));
}
