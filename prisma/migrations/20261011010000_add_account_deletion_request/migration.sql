-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_deletionRequestedAt_idx" ON "users"("deletionRequestedAt");
