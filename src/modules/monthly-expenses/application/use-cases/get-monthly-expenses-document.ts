import type { MonthlyExpensesRepository } from "../../domain/repositories/monthly-expenses-repository";
import {
  createEmptyMonthlyExpensesDocument,
  createMonthlyExpensesDocument,
  toMonthlyExpensesDocumentInput,
} from "../../domain/value-objects/monthly-expenses-document";
import type { GetMonthlyExpensesDocumentQuery } from "../queries/get-monthly-expenses-document-query";
import {
  toMonthlyExpensesDocumentResult,
  type MonthlyExpensesDocumentResult,
} from "../results/monthly-expenses-document-result";
import type { MonthlyExchangeRateSnapshot } from "@/modules/exchange-rates/domain/entities/monthly-exchange-rate-snapshot";

interface GetMonthlyExpensesDocumentDependencies {
  getExchangeRateSnapshot: (
    month: string,
  ) => Promise<MonthlyExchangeRateSnapshot>;
  query: GetMonthlyExpensesDocumentQuery;
  repository: MonthlyExpensesRepository;
}

export async function getMonthlyExpensesDocument({
  getExchangeRateSnapshot,
  query,
  repository,
}: GetMonthlyExpensesDocumentDependencies): Promise<MonthlyExpensesDocumentResult> {
  const storedDocument = await repository.getByMonth(query.month);

  try {
    const exchangeRateSnapshot = await getExchangeRateSnapshot(query.month);

    if (!storedDocument) {
      return toMonthlyExpensesDocumentResult(
        createMonthlyExpensesDocument(
          {
            exchangeRateSnapshot: {
              blueRate: exchangeRateSnapshot.blueRate,
              month: exchangeRateSnapshot.month,
              officialRate: exchangeRateSnapshot.officialRate,
              solidarityRate: exchangeRateSnapshot.solidarityRate,
            },
            items: [],
            month: query.month,
          },
          "Loading monthly expenses",
        ),
      );
    }

    if (storedDocument.exchangeRateSnapshot) {
      return toMonthlyExpensesDocumentResult(storedDocument);
    }

    const enrichedDocument = createMonthlyExpensesDocument(
      {
        ...toMonthlyExpensesDocumentInput(storedDocument),
        exchangeRateSnapshot: {
          blueRate: exchangeRateSnapshot.blueRate,
          month: exchangeRateSnapshot.month,
          officialRate: exchangeRateSnapshot.officialRate,
          solidarityRate: exchangeRateSnapshot.solidarityRate,
        },
      },
      "Loading monthly expenses",
    );

    await repository.save(enrichedDocument);

    return toMonthlyExpensesDocumentResult(enrichedDocument);
  } catch {
    return toMonthlyExpensesDocumentResult(
      storedDocument ?? createEmptyMonthlyExpensesDocument(query.month),
      "No pudimos cargar la cotización histórica del mes seleccionado.",
    );
  }
}
