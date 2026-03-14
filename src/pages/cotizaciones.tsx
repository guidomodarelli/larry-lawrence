import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";

import ExchangeRatesPage from "@/modules/exchange-rates/shared/pages/exchange-rates-page";
import {
  type ExchangeRatesRoutePageProps,
  getExchangeRatesServerSideProps,
} from "@/modules/exchange-rates/infrastructure/pages/exchange-rates-server-props";

export default function ExchangeRatesRoutePage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return <ExchangeRatesPage {...props} />;
}

export const getServerSideProps: GetServerSideProps<ExchangeRatesRoutePageProps> =
  async (context: GetServerSidePropsContext) => {
    return getExchangeRatesServerSideProps(context);
  };
