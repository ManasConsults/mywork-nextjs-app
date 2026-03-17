-- Drop foreign key constraints on budgets table
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_categoryId_fkey";
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_userId_fkey";

-- Drop unique index
DROP INDEX IF EXISTS "budgets_userId_categoryId_period_startDate_key";

-- Drop the budgets table
DROP TABLE IF EXISTS "budgets";

-- Drop the BudgetPeriod enum
DROP TYPE IF EXISTS "BudgetPeriod";
