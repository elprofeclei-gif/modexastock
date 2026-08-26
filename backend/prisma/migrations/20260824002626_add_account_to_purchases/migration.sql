-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_cashRegisterId_fkey";

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "accountId" TEXT,
ALTER COLUMN "cashRegisterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
