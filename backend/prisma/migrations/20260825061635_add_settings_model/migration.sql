-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL DEFAULT 'Modexastock',
    "taxId" TEXT NOT NULL DEFAULT 'NIT: 0000000-0',
    "address" TEXT NOT NULL DEFAULT 'Dirección de la tienda',
    "phone" TEXT NOT NULL DEFAULT '+00 000 000 0000',
    "currencySymbol" TEXT NOT NULL DEFAULT '$',
    "ticketFooter" TEXT NOT NULL DEFAULT '¡Gracias por su compra! Vuelva pronto.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
