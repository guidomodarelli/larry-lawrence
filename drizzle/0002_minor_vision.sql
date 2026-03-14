CREATE TABLE `monthly_exchange_rates` (
	`blue_rate` real NOT NULL,
	`iibb_rate_decimal_used` real NOT NULL,
	`month` text PRIMARY KEY NOT NULL,
	`official_rate` real NOT NULL,
	`solidarity_rate` real NOT NULL,
	`source` text NOT NULL,
	`source_date_iso` text NOT NULL,
	`updated_at_iso` text NOT NULL
);
