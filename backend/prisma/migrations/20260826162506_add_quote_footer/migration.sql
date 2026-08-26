-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_accountId_fkey";

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "accountId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "quoteFooter" TEXT NOT NULL DEFAULT 'Cotización válida por 3 días. Precios sujetos a cambios.';

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
