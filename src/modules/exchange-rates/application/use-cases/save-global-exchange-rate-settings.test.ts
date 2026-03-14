import { saveGlobalExchangeRateSettings } from "./save-global-exchange-rate-settings";

describe("saveGlobalExchangeRateSettings", () => {
  it("persists a validated IIBB decimal value", async () => {
    const save = jest.fn().mockResolvedValue({
      iibbRateDecimal: 0.03,
      updatedAtIso: "2026-03-14T12:00:00.000Z",
    });

    const result = await saveGlobalExchangeRateSettings({
      command: {
        iibbRateDecimal: 0.03,
      },
      repository: {
        get: jest.fn(),
        save,
      },
    });

    expect(save).toHaveBeenCalledWith(0.03);
    expect(result).toEqual({
      iibbRateDecimal: 0.03,
    });
  });

  it("rejects invalid IIBB decimal values", async () => {
    await expect(
      saveGlobalExchangeRateSettings({
        command: {
          iibbRateDecimal: 1,
        },
        repository: {
          get: jest.fn(),
          save: jest.fn(),
        },
      }),
    ).rejects.toThrow(
      "Saving global exchange rate settings requires an IIBB decimal value lower than 1.",
    );
  });
});
