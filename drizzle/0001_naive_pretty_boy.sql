CREATE TABLE `global_exchange_rate_settings` (
	`iibb_rate_decimal` real NOT NULL,
	`setting_key` text PRIMARY KEY NOT NULL,
	`updated_at_iso` text NOT NULL
);
