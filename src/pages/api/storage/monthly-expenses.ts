import { getMonthlyExpensesDocument } from "@/modules/monthly-expenses/application/use-cases/get-monthly-expenses-document";
import { saveMonthlyExpensesDocument } from "@/modules/monthly-expenses/application/use-cases/save-monthly-expenses-document";
import { createMonthlyExpensesApiHandler } from "@/modules/monthly-expenses/infrastructure/api/create-monthly-expenses-api-handler";
import { GoogleDriveMonthlyExpenseReceiptsRepository } from "@/modules/monthly-expenses/infrastructure/google-drive/repositories/google-drive-monthly-expense-receipts-repository";
import { DrizzleMonthlyExpensesRepository } from "@/modules/monthly-expenses/infrastructure/turso/repositories/drizzle-monthly-expenses-repository";
import { createGetMonthlyExchangeRateSnapshot } from "@/modules/exchange-rates/infrastructure/create-get-monthly-exchange-rate-snapshot";
import { getGoogleDriveClientFromRequest } from "@/modules/auth/infrastructure/google-drive/google-drive-client";

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
  async save({ command, database, request, userSubject }) {
    const getExchangeRateSnapshot = createGetMonthlyExchangeRateSnapshot(database);
    const driveClient = await getGoogleDriveClientFromRequest(request);

    return saveMonthlyExpensesDocument({
      command,
      getExchangeRateSnapshot,
      receiptsRepository: new GoogleDriveMonthlyExpenseReceiptsRepository(
        driveClient,
      ),
      repository: new DrizzleMonthlyExpensesRepository(database, userSubject),
    });
  },
});
