import { AmbitoExchangeRatesRepository } from "./ambito-exchange-rates-repository";

describe("AmbitoExchangeRatesRepository", () => {
  it("sends browser-like headers for Ambito exchange rate requests", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue({
      json: async () => ({
        venta: "1.234,56",
      }),
      ok: true,
    });
    const repository = new AmbitoExchangeRatesRepository(fetchImplementation);

    await repository.getRate("blue");

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://mercados.ambito.com/dolar/informal/variacion",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: expect.stringContaining("text/html"),
          "Accept-Language": "es-419,es;q=0.9",
          "Cache-Control": "max-age=0",
          "User-Agent": expect.stringContaining("Chrome/145.0.0.0"),
        }),
        method: "GET",
      }),
    );
  });

  it("throws when Ambito answers with a non-ok status", async () => {
    const repository = new AmbitoExchangeRatesRepository(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
      }),
    );

    await expect(repository.getRate("official")).rejects.toThrow(
      "ambito-exchange-rates-repository:getRate received 403 for official.",
    );
  });
});
