-- CreateTable
CREATE TABLE "SuspendedSale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspendedSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SuspendedSale" ADD CONSTRAINT "SuspendedSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
