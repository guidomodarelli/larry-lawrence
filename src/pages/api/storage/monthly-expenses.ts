import { getMonthlyExpensesDocument } from "@/modules/monthly-expenses/application/use-cases/get-monthly-expenses-document";
import { saveMonthlyExpensesDocument } from "@/modules/monthly-expenses/application/use-cases/save-monthly-expenses-document";
import { createMonthlyExpensesApiHandler } from "@/modules/monthly-expenses/infrastructure/api/create-monthly-expenses-api-handler";
import { DrizzleMonthlyExpensesRepository } from "@/modules/monthly-expenses/infrastructure/turso/repositories/drizzle-monthly-expenses-repository";
import { createGetMonthlyExchangeRateSnapshot } from "@/modules/exchange-rates/infrastructure/create-get-monthly-exchange-rate-snapshot";

export default createMonthlyExpensesApiHandler({
  async load({ database, month, userSubject }) {
    const getExchangeRateSnapshot = createGetMonthlyExchangeRateSnapshot(database);

    return getMonthlyExpensesDocument({
      getExchangeRateSnapshot,
      query: {
        month,
      },
      repository: new DrizzleMonthlyExpensesRepository(database, userSubject),
    });
  },
  async save({ command, database, userSubject }) {
    const getExchangeRateSnapshot = createGetMonthlyExchangeRateSnapshot(database);

    return saveMonthlyExpensesDocument({
      command,
      getExchangeRateSnapshot,
      repository: new DrizzleMonthlyExpensesRepository(database, userSubject),
    });
  },
});
