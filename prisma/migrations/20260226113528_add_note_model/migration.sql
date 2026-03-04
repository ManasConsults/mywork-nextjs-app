-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200),
    "body" JSONB NOT NULL,
    "tags" TEXT[],
    "taskId" TEXT,
    "userId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_userId_deletedAt_idx" ON "notes"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "notes_taskId_idx" ON "notes"("taskId");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
