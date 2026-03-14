import { mapAmbitoDollarRateDtoToRate, sanitizePrice } from "./mapper";

describe("exchange-rates mapper", () => {
  it("sanitizes localized price strings from Ambito", () => {
    expect(sanitizePrice("1.234,56")).toBe(1234.56);
  });

  it("maps the venta field from Ambito payloads", () => {
    expect(
      mapAmbitoDollarRateDtoToRate({
        venta: "321,50",
      }),
    ).toBe(321.5);
  });

  it("rejects payloads without venta", () => {
    expect(() => mapAmbitoDollarRateDtoToRate({})).toThrow(
      "Cannot map an Ambito dollar rate DTO without a venta value.",
    );
  });
});
