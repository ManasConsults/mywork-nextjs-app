-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bsb" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "swiftBic" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paymentAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
