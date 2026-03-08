export function getSafeLoansReportErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No pudimos actualizar el reporte de deudas en este momento. Igual podés seguir cargando gastos y volver a intentarlo más tarde.";

  if (!(error instanceof Error) && typeof error !== "string") {
    return fallbackMessage;
  }

  const message = typeof error === "string" ? error : error.message;

  if (
    message.includes("Google authentication is required") ||
    message.includes("Conectate con Google")
  ) {
    return "Conectate con Google para consultar el reporte de deudas.";
  }

  if (message.includes("missing the Drive permissions required")) {
    return "Tu sesión actual no tiene permisos suficientes para consultar el reporte de deudas en Drive.";
  }

  return fallbackMessage;
}

export function getSafeMonthlyExpensesErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No pudimos guardar los gastos mensuales en este momento. Revisá los datos y volvé a intentarlo.";

  if (!(error instanceof Error) && typeof error !== "string") {
    return fallbackMessage;
  }

  const message = typeof error === "string" ? error : error.message;

  if (message.includes("Google authentication is required")) {
    return "Conectate con Google para guardar tus gastos mensuales en Drive.";
  }

  if (message.includes("missing the Drive permissions required")) {
    return "Tu sesión actual no tiene permisos suficientes para guardar gastos mensuales en Drive.";
  }

  if (message.includes("Google Drive rejected the monthly expenses payload")) {
    return "No pudimos guardar los gastos porque algunos datos no son válidos. Revisá la planilla y volvé a intentarlo.";
  }

  return fallbackMessage;
}

export function getSafeLendersErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No pudimos actualizar el catálogo de prestadores en este momento. Volvé a intentarlo más tarde.";

  if (!(error instanceof Error) && typeof error !== "string") {
    return fallbackMessage;
  }

  const message = typeof error === "string" ? error : error.message;

  if (message.includes("Google authentication is required")) {
    return "Conectate con Google para gestionar el catálogo de prestadores.";
  }

  if (message.includes("missing the Drive permissions required")) {
    return "Tu sesión actual no tiene permisos suficientes para gestionar prestadores en Drive.";
  }

  return fallbackMessage;
}
