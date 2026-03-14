import type { AmbitoDollarRateDto } from "./dto/ambito-dollar-rate.dto";

export function sanitizePrice(price: string): number {
  const normalizedPrice = Number.parseFloat(
    price.replace(/\./g, "").replace(/,/g, "."),
  );

  if (!Number.isFinite(normalizedPrice)) {
    throw new Error(
      "sanitizePrice requires a valid numeric string with the expected locale format.",
    );
  }

  return normalizedPrice;
}

export function mapAmbitoDollarRateDtoToRate(dto: AmbitoDollarRateDto): number {
  const venta = dto.venta?.trim();

  if (!venta) {
    throw new Error(
      "Cannot map an Ambito dollar rate DTO without a venta value.",
    );
  }

  return sanitizePrice(venta);
}
