-- AlterTable
ALTER TABLE "CashRegister" ADD COLUMN     "physicalBoxId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PhysicalBox" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalBox_name_key" ON "PhysicalBox"("name");

-- AddForeignKey
ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_physicalBoxId_fkey" FOREIGN KEY ("physicalBoxId") REFERENCES "PhysicalBox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
