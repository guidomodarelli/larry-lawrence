import type { MonthlyExpensesRepository } from "../../domain/repositories/monthly-expenses-repository";
import { getMonthlyExpensesDocument } from "./get-monthly-expenses-document";

const getExchangeRateSnapshot = jest.fn().mockResolvedValue({
  blueRate: 1290,
  iibbRateDecimalUsed: 0.02,
  month: "2026-03",
  officialRate: 1200,
  solidarityRate: 1476,
  source: "ambito-historico-general",
  sourceDateIso: "2026-03-31",
  updatedAtIso: "2026-03-14T12:00:00.000Z",
});

describe("getMonthlyExpensesDocument", () => {
  beforeEach(() => {
    getExchangeRateSnapshot.mockClear();
  });

  it("returns an empty monthly document with the selected month snapshot when there is no stored file", async () => {
    const repository: MonthlyExpensesRepository = {
      getByMonth: jest.fn().mockResolvedValue(null),
      listAll: jest.fn(),
      save: jest.fn(),
    };

    const result = await getMonthlyExpensesDocument({
      getExchangeRateSnapshot,
      query: {
        month: "2026-03",
      },
      repository,
    });

    expect(result).toEqual({
      exchangeRateLoadError: null,
      exchangeRateSnapshot: {
        blueRate: 1290,
        month: "2026-03",
        officialRate: 1200,
        solidarityRate: 1476,
      },
      items: [],
      month: "2026-03",
    });
  });

  it("backfills a stored document when the snapshot is missing", async () => {
    const repository: MonthlyExpensesRepository = {
      getByMonth: jest.fn().mockResolvedValue({
        items: [],
        month: "2026-03",
      }),
      listAll: jest.fn(),
      save: jest.fn(),
    };

    const result = await getMonthlyExpensesDocument({
      getExchangeRateSnapshot,
      query: {
        month: "2026-03",
      },
      repository,
    });

    expect(result).toEqual({
      exchangeRateLoadError: null,
      exchangeRateSnapshot: {
        blueRate: 1290,
        month: "2026-03",
        officialRate: 1200,
        solidarityRate: 1476,
      },
      items: [],
      month: "2026-03",
    });
    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
