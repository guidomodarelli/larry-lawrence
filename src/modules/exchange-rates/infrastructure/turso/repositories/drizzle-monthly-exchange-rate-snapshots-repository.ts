import { eq } from "drizzle-orm";

import { monthlyExchangeRatesTable } from "@/modules/shared/infrastructure/database/drizzle/schema";
import type { TursoDatabase } from "@/modules/shared/infrastructure/database/drizzle/turso-database";

import type { MonthlyExchangeRateSnapshot } from "../../../domain/entities/monthly-exchange-rate-snapshot";
import type { MonthlyExchangeRateSnapshotsRepository } from "../../../domain/repositories/monthly-exchange-rate-snapshots-repository";

export class DrizzleMonthlyExchangeRateSnapshotsRepository
  implements MonthlyExchangeRateSnapshotsRepository
{
  constructor(private readonly database: TursoDatabase) {}

  async getByMonth(month: string): Promise<MonthlyExchangeRateSnapshot | null> {
    const rows = await this.database
      .select()
      .from(monthlyExchangeRatesTable)
      .where(eq(monthlyExchangeRatesTable.month, month))
      .limit(1);
    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      blueRate: row.blueRate,
      iibbRateDecimalUsed: row.iibbRateDecimalUsed,
      month: row.month,
      officialRate: row.officialRate,
      solidarityRate: row.solidarityRate,
      source: row.source,
      sourceDateIso: row.sourceDateIso,
      updatedAtIso: row.updatedAtIso,
    };
  }

  async save(
    snapshot: MonthlyExchangeRateSnapshot,
  ): Promise<MonthlyExchangeRateSnapshot> {
    await this.database
      .insert(monthlyExchangeRatesTable)
      .values({
        blueRate: snapshot.blueRate,
        iibbRateDecimalUsed: snapshot.iibbRateDecimalUsed,
        month: snapshot.month,
        officialRate: snapshot.officialRate,
        solidarityRate: snapshot.solidarityRate,
        source: snapshot.source,
        sourceDateIso: snapshot.sourceDateIso,
        updatedAtIso: snapshot.updatedAtIso,
      })
      .onConflictDoUpdate({
        set: {
          blueRate: snapshot.blueRate,
          iibbRateDecimalUsed: snapshot.iibbRateDecimalUsed,
          officialRate: snapshot.officialRate,
          solidarityRate: snapshot.solidarityRate,
          source: snapshot.source,
          sourceDateIso: snapshot.sourceDateIso,
          updatedAtIso: snapshot.updatedAtIso,
        },
        target: monthlyExchangeRatesTable.month,
      });

    return snapshot;
  }
}
