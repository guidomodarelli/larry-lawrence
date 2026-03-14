import { createIibbRateDecimal } from "../../domain/value-objects/iibb-rate-decimal";
import type { GlobalExchangeRateSettingsRepository } from "../../domain/repositories/global-exchange-rate-settings-repository";

import type { SaveGlobalExchangeRateSettingsCommand } from "../commands/save-global-exchange-rate-settings-command";
import type { GlobalExchangeRateSettingsResult } from "../results/global-exchange-rate-settings-result";

export async function saveGlobalExchangeRateSettings({
  command,
  repository,
}: {
  command: SaveGlobalExchangeRateSettingsCommand;
  repository: GlobalExchangeRateSettingsRepository;
}): Promise<GlobalExchangeRateSettingsResult> {
  const iibbRateDecimal = createIibbRateDecimal(
    command.iibbRateDecimal,
    "Saving global exchange rate settings",
  );
  const settings = await repository.save(iibbRateDecimal);

  return {
    iibbRateDecimal: settings.iibbRateDecimal,
  };
}
