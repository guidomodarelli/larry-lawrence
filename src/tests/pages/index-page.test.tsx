import type { GetServerSidePropsContext } from "next";

import { getServerSideProps } from "@/pages/index";

function createContext(
  query: GetServerSidePropsContext["query"],
): GetServerSidePropsContext {
  return {
    query,
    req: {} as GetServerSidePropsContext["req"],
    res: {} as GetServerSidePropsContext["res"],
    resolvedUrl: "/",
  } as unknown as GetServerSidePropsContext;
}

describe("HomePage redirect", () => {
  it("redirects root traffic to /gastos", async () => {
    const result = await getServerSideProps(createContext({}));

    expect("redirect" in result && result.redirect?.destination).toBe("/gastos");
    expect("redirect" in result).toBe(true);
  });

  it("maps legacy tab=lenders to /prestadores", async () => {
    const result = await getServerSideProps(createContext({
      tab: "lenders",
    }));

    expect("redirect" in result && result.redirect?.destination).toBe(
      "/prestadores",
    );
  });

  it("maps legacy tab=exchange-rates to /cotizaciones", async () => {
    const result = await getServerSideProps(createContext({
      tab: "exchange-rates",
    }));

    expect("redirect" in result && result.redirect?.destination).toBe(
      "/cotizaciones",
    );
  });

  it("preserves month when redirecting legacy tab=exchange-rates", async () => {
    const result = await getServerSideProps(createContext({
      month: "2026-03",
      tab: "exchange-rates",
    }));

    expect("redirect" in result && result.redirect?.destination).toBe(
      "/cotizaciones?month=2026-03",
    );
  });

  it("preserves month when redirecting to /gastos", async () => {
    const result = await getServerSideProps(createContext({
      month: "2026-04",
    }));

    expect("redirect" in result && result.redirect?.destination).toBe(
      "/gastos?month=2026-04",
    );
  });
});
