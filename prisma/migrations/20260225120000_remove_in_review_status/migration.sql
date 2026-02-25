-- Migrate any tasks with IN_REVIEW status to DONE before removing the value
UPDATE "tasks" SET "status" = 'DONE' WHERE "status"::text = 'IN_REVIEW';

-- Drop the default so we can change the enum type
ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;

-- Rename old enum
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";

-- Create new enum without IN_REVIEW
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- Update the column to use the new enum
ALTER TABLE "tasks"
  ALTER COLUMN "status" TYPE "TaskStatus"
  USING "status"::text::"TaskStatus";

-- Restore the default
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'BACKLOG'::"TaskStatus";

-- Drop old enum
DROP TYPE "TaskStatus_old";
