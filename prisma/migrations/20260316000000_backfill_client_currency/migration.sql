-- Backfill client currency from their owner's user record.
-- Existing clients were always created with the schema default ('GBP');
-- this corrects them to reflect the user's actual configured currency.
UPDATE "clients" c
SET "currency" = u."currency"
FROM "users" u
WHERE c."userId" = u."id";
