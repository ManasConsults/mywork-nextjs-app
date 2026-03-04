-- CreateTable
CREATE TABLE "todo_items" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todo_items_userId_isDone_idx" ON "todo_items"("userId", "isDone");

-- AddForeignKey
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
