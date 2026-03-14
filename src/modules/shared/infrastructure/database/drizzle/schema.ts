import { primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const monthlyExpensesDocumentsTable = sqliteTable(
  "monthly_expenses_documents",
  {
    month: text("month").notNull(),
    payloadJson: text("payload_json").notNull(),
    updatedAtIso: text("updated_at_iso").notNull(),
    userSubject: text("user_subject").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userSubject, table.month],
    }),
  ],
);

export const lendersCatalogDocumentsTable = sqliteTable(
  "lenders_catalog_documents",
  {
    payloadJson: text("payload_json").notNull(),
    updatedAtIso: text("updated_at_iso").notNull(),
    userSubject: text("user_subject").primaryKey(),
  },
);

export const applicationSettingsDocumentsTable = sqliteTable(
  "application_settings_documents",
  {
    content: text("content").notNull(),
    mimeType: text("mime_type").notNull(),
    name: text("name").notNull(),
    updatedAtIso: text("updated_at_iso").notNull(),
    userSubject: text("user_subject").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userSubject, table.name],
    }),
  ],
);

export const globalExchangeRateSettingsTable = sqliteTable(
  "global_exchange_rate_settings",
  {
    iibbRateDecimal: real("iibb_rate_decimal").notNull(),
    settingKey: text("setting_key").primaryKey(),
    updatedAtIso: text("updated_at_iso").notNull(),
  },
);

export const monthlyExchangeRatesTable = sqliteTable("monthly_exchange_rates", {
  blueRate: real("blue_rate").notNull(),
  iibbRateDecimalUsed: real("iibb_rate_decimal_used").notNull(),
  month: text("month").primaryKey(),
  officialRate: real("official_rate").notNull(),
  solidarityRate: real("solidarity_rate").notNull(),
  source: text("source").notNull(),
  sourceDateIso: text("source_date_iso").notNull(),
  updatedAtIso: text("updated_at_iso").notNull(),
});
