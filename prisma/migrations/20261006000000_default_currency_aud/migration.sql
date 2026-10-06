-- Change the default currency for new rows from GBP to AUD.
-- Defaults only: existing rows keep their stored currency, since rewriting the code
-- without converting amounts would silently change what those values mean.
ALTER TABLE "users" ALTER COLUMN "currency" SET DEFAULT 'AUD';
ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'AUD';
ALTER TABLE "clients" ALTER COLUMN "currency" SET DEFAULT 'AUD';
ALTER TABLE "invoices" ALTER COLUMN "currency" SET DEFAULT 'AUD';
