import type { GetServerSidePropsContext } from "next";

import {
  getAuthenticatedUserEmailFromRequest,
} from "@/modules/auth/infrastructure/next-auth/authenticated-user-email";
import {
  isGoogleAdminEmail,
} from "@/modules/auth/infrastructure/next-auth/google-admin-allowlist";
import { isGoogleOAuthConfigured } from "@/modules/auth/infrastructure/oauth/google-oauth-config";
import { GOOGLE_OAUTH_SCOPES } from "@/modules/auth/infrastructure/oauth/google-oauth-scopes";
import {
  createMigratedTursoDatabase,
} from "@/modules/shared/infrastructure/database/drizzle/turso-database";
import {
  appLogger,
  createRequestLogContext,
} from "@/modules/shared/infrastructure/observability/app-logger";
import {
  getRequestedSidebarOpen,
  SIDEBAR_STATE_COOKIE_NAME,
} from "@/modules/shared/infrastructure/pages/sidebar-state";
import { getStorageBootstrap } from "@/modules/storage/application/queries/get-storage-bootstrap";
import type { StorageBootstrapResult } from "@/modules/storage/application/results/storage-bootstrap";

import type { ExchangeRatesPageResult } from "../../application/results/exchange-rates-page-result";
import {
  DEFAULT_IIBB_RATE_DECIMAL,
  getExchangeRatesPageResult,
} from "../../application/use-cases/get-exchange-rates-page-result";
import { AmbitoExchangeRatesRepository } from "../api/ambito-exchange-rates-repository";
import { DrizzleGlobalExchangeRateSettingsRepository } from "../turso/repositories/drizzle-global-exchange-rate-settings-repository";

export interface ExchangeRatesRoutePageProps {
  bootstrap: StorageBootstrapResult;
  initialSidebarOpen?: boolean;
  result: ExchangeRatesPageResult;
}

function createFallbackExchangeRatesPageResult(
  canEditIibb: boolean,
  loadError: string,
): ExchangeRatesPageResult {
  return {
    blueRate: 0,
    canEditIibb,
    iibbRateDecimal: DEFAULT_IIBB_RATE_DECIMAL,
    loadError,
    officialRate: 0,
    solidarityRate: 0,
  };
}

async function getCanEditIibb(context: GetServerSidePropsContext): Promise<boolean> {
  try {
    const userEmail = await getAuthenticatedUserEmailFromRequest(context.req);

    return isGoogleAdminEmail(userEmail);
  } catch {
    return false;
  }
}

export async function getExchangeRatesServerSideProps(
  context: GetServerSidePropsContext,
): Promise<{ props: ExchangeRatesRoutePageProps }> {
  const requestContext = createRequestLogContext(context.req);
  const initialSidebarOpen = getRequestedSidebarOpen(
    context.req.cookies?.[SIDEBAR_STATE_COOKIE_NAME],
  );
  const bootstrap = getStorageBootstrap({
    isGoogleOAuthConfigured: isGoogleOAuthConfigured(),
    requiredScopes: GOOGLE_OAUTH_SCOPES,
  });
  const canEditIibb = await getCanEditIibb(context);

  try {
    const database = await createMigratedTursoDatabase();
    const settingsRepository = new DrizzleGlobalExchangeRateSettingsRepository(
      database,
    );
    const exchangeRatesRepository = new AmbitoExchangeRatesRepository();

    return {
      props: {
        bootstrap,
        initialSidebarOpen,
        result: await getExchangeRatesPageResult({
          canEditIibb,
          exchangeRatesRepository,
          settingsRepository,
        }),
      },
    };
  } catch (error) {
    appLogger.error("exchange-rates SSR request failed", {
      context: {
        ...requestContext,
        operation: "exchange-rates-ssr:get-server-side-props",
      },
      error,
    });

    return {
      props: {
        bootstrap,
        initialSidebarOpen,
        result: createFallbackExchangeRatesPageResult(
          canEditIibb,
          "No pudimos cargar las cotizaciones del dólar en este momento.",
        ),
      },
    };
  }
}
