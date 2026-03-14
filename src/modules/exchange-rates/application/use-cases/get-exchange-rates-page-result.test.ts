import { getExchangeRatesPageResult } from "./get-exchange-rates-page-result";

describe("getExchangeRatesPageResult", () => {
  it("builds the page result from official, blue, and persisted IIBB values", async () => {
    const result = await getExchangeRatesPageResult({
      canEditIibb: true,
      exchangeRatesRepository: {
        getRate: jest
          .fn()
          .mockResolvedValueOnce(1200)
          .mockResolvedValueOnce(1250),
      },
      settingsRepository: {
        get: jest.fn().mockResolvedValue({
          iibbRateDecimal: 0.02,
          updatedAtIso: "2026-03-14T12:00:00.000Z",
        }),
        save: jest.fn(),
      },
    });

    expect(result).toEqual({
      blueRate: 1250,
      canEditIibb: true,
      iibbRateDecimal: 0.02,
      loadError: null,
      officialRate: 1200,
      solidarityRate: 1476,
    });
  });

  it("uses the default IIBB value when there is no persisted global setting", async () => {
    const result = await getExchangeRatesPageResult({
      canEditIibb: false,
      exchangeRatesRepository: {
        getRate: jest.fn().mockResolvedValue(1000),
      },
      settingsRepository: {
        get: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      },
    });

    expect(result.iibbRateDecimal).toBe(0.02);
    expect(result.solidarityRate).toBe(1230);
  });
});
