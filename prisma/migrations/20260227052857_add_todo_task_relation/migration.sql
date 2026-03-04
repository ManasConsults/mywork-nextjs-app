-- AlterTable
ALTER TABLE "todo_items" ADD COLUMN     "taskId" TEXT;

-- CreateIndex
CREATE INDEX "todo_items_taskId_idx" ON "todo_items"("taskId");

-- AddForeignKey
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
