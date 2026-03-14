import { getMonthlyExchangeRateSnapshot } from "./get-monthly-exchange-rate-snapshot";

describe("getMonthlyExchangeRateSnapshot", () => {
  it("uses the cache when the month already exists with the same IIBB", async () => {
    const getMonthlyRate = jest.fn();
    const save = jest.fn();

    const result = await getMonthlyExchangeRateSnapshot({
      exchangeRatesRepository: {
        getMonthlyRate,
      },
      month: "2026-03",
      monthlyExchangeRateSnapshotsRepository: {
        getByMonth: jest.fn().mockResolvedValue({
          blueRate: 1290,
          iibbRateDecimalUsed: 0.02,
          month: "2026-03",
          officialRate: 1200,
          solidarityRate: 1476,
          source: "ambito-historico-general",
          sourceDateIso: "2026-03-31",
          updatedAtIso: "2026-03-14T12:00:00.000Z",
        }),
        save,
      },
      settingsRepository: {
        get: jest.fn().mockResolvedValue({
          iibbRateDecimal: 0.02,
          updatedAtIso: "2026-03-14T12:00:00.000Z",
        }),
        save: jest.fn(),
      },
    });

    expect(getMonthlyRate).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(result.solidarityRate).toBe(1476);
  });

  it("queries Ambito and persists the snapshot on cache miss", async () => {
    const save = jest.fn().mockImplementation(async (snapshot) => snapshot);

    const result = await getMonthlyExchangeRateSnapshot({
      exchangeRatesRepository: {
        getMonthlyRate: jest
          .fn()
          .mockResolvedValueOnce({
            month: "2026-03",
            rate: 1200,
            sourceDateIso: "2026-03-31",
            variant: "official",
          })
          .mockResolvedValueOnce({
            month: "2026-03",
            rate: 1290,
            sourceDateIso: "2026-03-31",
            variant: "blue",
          }),
      },
      month: "2026-03",
      monthlyExchangeRateSnapshotsRepository: {
        getByMonth: jest.fn().mockResolvedValue(null),
        save,
      },
      now: () => new Date("2026-03-14T12:00:00.000Z"),
      settingsRepository: {
        get: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      },
    });

    expect(save).toHaveBeenCalledWith({
      blueRate: 1290,
      iibbRateDecimalUsed: 0.02,
      month: "2026-03",
      officialRate: 1200,
      solidarityRate: 1476,
      source: "ambito-historico-general",
      sourceDateIso: "2026-03-31",
      updatedAtIso: "2026-03-14T12:00:00.000Z",
    });
    expect(result.solidarityRate).toBe(1476);
  });

  it("refreshes the cached solidarity rate when IIBB changes", async () => {
    const save = jest.fn().mockImplementation(async (snapshot) => snapshot);

    const result = await getMonthlyExchangeRateSnapshot({
      exchangeRatesRepository: {
        getMonthlyRate: jest.fn(),
      },
      month: "2026-03",
      monthlyExchangeRateSnapshotsRepository: {
        getByMonth: jest.fn().mockResolvedValue({
          blueRate: 1290,
          iibbRateDecimalUsed: 0.02,
          month: "2026-03",
          officialRate: 1200,
          solidarityRate: 1476,
          source: "ambito-historico-general",
          sourceDateIso: "2026-03-31",
          updatedAtIso: "2026-03-14T12:00:00.000Z",
        }),
        save,
      },
      now: () => new Date("2026-03-20T12:00:00.000Z"),
      settingsRepository: {
        get: jest.fn().mockResolvedValue({
          iibbRateDecimal: 0.05,
          updatedAtIso: "2026-03-20T10:00:00.000Z",
        }),
        save: jest.fn(),
      },
    });

    expect(save).toHaveBeenCalledWith({
      blueRate: 1290,
      iibbRateDecimalUsed: 0.05,
      month: "2026-03",
      officialRate: 1200,
      solidarityRate: 1512,
      source: "ambito-historico-general",
      sourceDateIso: "2026-03-31",
      updatedAtIso: "2026-03-20T12:00:00.000Z",
    });
    expect(result.solidarityRate).toBe(1512);
  });
});
