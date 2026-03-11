-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYED', 'SOLE_TRADER', 'BOTH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'EMPLOYED',
ADD COLUMN     "moduleFinance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "moduleWork" BOOLEAN NOT NULL DEFAULT true;
