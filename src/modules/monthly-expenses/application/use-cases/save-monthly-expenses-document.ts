import type { MonthlyExpensesRepository } from "../../domain/repositories/monthly-expenses-repository";
import {
  createMonthlyExpensesDocument,
  type MonthlyExpensesDocument,
  toMonthlyExpensesDocumentInput,
} from "../../domain/value-objects/monthly-expenses-document";
import type { SaveMonthlyExpensesCommand } from "../commands/save-monthly-expenses-command";
import {
  toStoredMonthlyExpensesDocumentResult,
  type StoredMonthlyExpensesDocumentResult,
} from "../results/stored-monthly-expenses-document-result";
import type { MonthlyExchangeRateSnapshot } from "@/modules/exchange-rates/domain/entities/monthly-exchange-rate-snapshot";

interface SaveMonthlyExpensesDocumentDependencies {
  command: SaveMonthlyExpensesCommand;
  getExchangeRateSnapshot: (
    month: string,
  ) => Promise<MonthlyExchangeRateSnapshot>;
  repository: MonthlyExpensesRepository;
}

export async function saveMonthlyExpensesDocument({
  command,
  getExchangeRateSnapshot,
  repository,
}: SaveMonthlyExpensesDocumentDependencies): Promise<StoredMonthlyExpensesDocumentResult> {
  const validatedBaseDocument: MonthlyExpensesDocument = createMonthlyExpensesDocument(
    command,
    "Saving monthly expenses",
  );
  const exchangeRateSnapshot = await getExchangeRateSnapshot(
    validatedBaseDocument.month,
  );
  const validatedDocument: MonthlyExpensesDocument = createMonthlyExpensesDocument(
    {
      ...toMonthlyExpensesDocumentInput(validatedBaseDocument),
      exchangeRateSnapshot: {
        blueRate: exchangeRateSnapshot.blueRate,
        month: exchangeRateSnapshot.month,
        officialRate: exchangeRateSnapshot.officialRate,
        solidarityRate: exchangeRateSnapshot.solidarityRate,
      },
    },
    "Saving monthly expenses",
  );

  return toStoredMonthlyExpensesDocumentResult(
    await repository.save(validatedDocument),
  );
}
