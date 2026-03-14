import type { MonthlyExpensesRepository } from "../../domain/repositories/monthly-expenses-repository";
import { saveMonthlyExpensesDocument } from "./save-monthly-expenses-document";

describe("saveMonthlyExpensesDocument", () => {
  it("delegates a validated monthly document with the snapshot to the repository", async () => {
    const repository: MonthlyExpensesRepository = {
      getByMonth: jest.fn(),
      listAll: jest.fn(),
      save: jest.fn().mockResolvedValue({
        id: "monthly-expenses-file-id",
        month: "2026-03",
        name: "gastos-mensuales-2026-marzo.json",
        viewUrl: "https://drive.google.com/file/d/monthly-expenses-file-id/view",
      }),
    };

    const result = await saveMonthlyExpensesDocument({
      command: {
        items: [
          {
            currency: "ARS",
            description: "Expensas",
            id: "expense-1",
            occurrencesPerMonth: 1,
            subtotal: 55032.07,
          },
        ],
        month: "2026-03",
      },
      getExchangeRateSnapshot: jest.fn().mockResolvedValue({
        blueRate: 1290,
        iibbRateDecimalUsed: 0.02,
        month: "2026-03",
        officialRate: 1200,
        solidarityRate: 1476,
        source: "ambito-historico-general",
        sourceDateIso: "2026-03-31",
        updatedAtIso: "2026-03-14T12:00:00.000Z",
      }),
      repository,
    });

    expect(repository.save).toHaveBeenCalledWith({
      exchangeRateSnapshot: {
        blueRate: 1290,
        month: "2026-03",
        officialRate: 1200,
        solidarityRate: 1476,
      },
      items: [
        {
          currency: "ARS",
          description: "Expensas",
          id: "expense-1",
          occurrencesPerMonth: 1,
          subtotal: 55032.07,
          total: 55032.07,
        },
      ],
      month: "2026-03",
    });
    expect(result).toEqual({
      id: "monthly-expenses-file-id",
      month: "2026-03",
      name: "gastos-mensuales-2026-marzo.json",
      viewUrl: "https://drive.google.com/file/d/monthly-expenses-file-id/view",
    });
  });
});
