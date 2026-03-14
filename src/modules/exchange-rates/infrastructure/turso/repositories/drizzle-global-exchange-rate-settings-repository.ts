import { eq } from "drizzle-orm";

import {
  globalExchangeRateSettingsTable,
} from "@/modules/shared/infrastructure/database/drizzle/schema";
import type { TursoDatabase } from "@/modules/shared/infrastructure/database/drizzle/turso-database";

import type { GlobalExchangeRateSettings } from "../../../domain/entities/global-exchange-rate-settings";
import type { GlobalExchangeRateSettingsRepository } from "../../../domain/repositories/global-exchange-rate-settings-repository";

const GLOBAL_EXCHANGE_RATE_SETTINGS_PRIMARY_KEY = "global";

export class DrizzleGlobalExchangeRateSettingsRepository
  implements GlobalExchangeRateSettingsRepository
{
  constructor(private readonly database: TursoDatabase) {}

  async get(): Promise<GlobalExchangeRateSettings | null> {
    const storedSettings = await this.database.query.globalExchangeRateSettingsTable.findFirst({
      where: eq(
        globalExchangeRateSettingsTable.settingKey,
        GLOBAL_EXCHANGE_RATE_SETTINGS_PRIMARY_KEY,
      ),
    });

    if (!storedSettings) {
      return null;
    }

    return {
      iibbRateDecimal: storedSettings.iibbRateDecimal,
      updatedAtIso: storedSettings.updatedAtIso,
    };
  }

  async save(iibbRateDecimal: number): Promise<GlobalExchangeRateSettings> {
    const updatedAtIso = new Date().toISOString();

    await this.database
      .insert(globalExchangeRateSettingsTable)
      .values({
        iibbRateDecimal,
        settingKey: GLOBAL_EXCHANGE_RATE_SETTINGS_PRIMARY_KEY,
        updatedAtIso,
      })
      .onConflictDoUpdate({
        set: {
          iibbRateDecimal,
          updatedAtIso,
        },
        target: globalExchangeRateSettingsTable.settingKey,
      });

    return {
      iibbRateDecimal,
      updatedAtIso,
    };
  }
}
