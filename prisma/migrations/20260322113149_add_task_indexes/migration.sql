-- CreateIndex
CREATE INDEX "tasks_userId_deletedAt_createdAt_idx" ON "tasks"("userId", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tasks_userId_deletedAt_dueDate_idx" ON "tasks"("userId", "deletedAt", "dueDate" DESC);

-- CreateIndex
CREATE INDEX "tasks_userId_deletedAt_status_idx" ON "tasks"("userId", "deletedAt", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_deletedAt_priority_idx" ON "tasks"("userId", "deletedAt", "priority");
