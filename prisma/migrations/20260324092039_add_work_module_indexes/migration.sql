-- CreateIndex
CREATE INDEX "achievements_userId_deletedAt_dateAchieved_idx" ON "achievements"("userId", "deletedAt", "dateAchieved" DESC);

-- CreateIndex
CREATE INDEX "achievements_userId_deletedAt_createdAt_idx" ON "achievements"("userId", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "achievements_userId_deletedAt_updatedAt_idx" ON "achievements"("userId", "deletedAt", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "achievements_userId_deletedAt_category_idx" ON "achievements"("userId", "deletedAt", "category");

-- CreateIndex
CREATE INDEX "notes_userId_deletedAt_updatedAt_idx" ON "notes"("userId", "deletedAt", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "notes_userId_deletedAt_createdAt_idx" ON "notes"("userId", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "todo_items_userId_isDone_createdAt_idx" ON "todo_items"("userId", "isDone", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "todo_items_userId_isDone_dueDate_idx" ON "todo_items"("userId", "isDone", "dueDate" ASC);

-- CreateIndex
CREATE INDEX "work_logs_userId_createdAt_idx" ON "work_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "work_logs_userId_taskId_idx" ON "work_logs"("userId", "taskId");

-- CreateIndex
CREATE INDEX "work_logs_userId_date_idx" ON "work_logs"("userId", "date" DESC);
