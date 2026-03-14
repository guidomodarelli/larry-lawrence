import type { GetServerSideProps, GetServerSidePropsContext } from "next";

const MONTHLY_EXPENSES_TAB_KEYS = ["expenses", "lenders", "debts"] as const;
type MonthlyExpensesTabKey = (typeof MONTHLY_EXPENSES_TAB_KEYS)[number];

function isMonthlyExpensesTabKey(value: string): value is MonthlyExpensesTabKey {
  return MONTHLY_EXPENSES_TAB_KEYS.includes(value as MonthlyExpensesTabKey);
}

function getRequestedMonthlyExpensesTab(
  queryValue: GetServerSidePropsContext["query"]["tab"],
): MonthlyExpensesTabKey {
  const tabValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const normalizedTab = tabValue?.trim();

  return normalizedTab && isMonthlyExpensesTabKey(normalizedTab)
    ? normalizedTab
    : "expenses";
}

export default function HomePageRedirect() {
  return null;
}

function getRedirectDestination(context: GetServerSidePropsContext): string {
  const requestedTab = getRequestedMonthlyExpensesTab(context.query.tab);

  if (requestedTab === "lenders") {
    return "/prestadores";
  }

  if (requestedTab === "debts") {
    return "/reportes/deudas";
  }

  const monthQuery = Array.isArray(context.query.month)
    ? context.query.month[0]
    : context.query.month;
  const normalizedMonth = monthQuery?.trim();

  return normalizedMonth ? `/gastos?month=${encodeURIComponent(normalizedMonth)}` : "/gastos";
}

export const getServerSideProps: GetServerSideProps = async (
  context,
) => ({
  redirect: {
    destination: getRedirectDestination(context),
    permanent: false,
  },
});
