ALTER TABLE "Transaction" ADD COLUMN "rfidReadSessionId" TEXT;

CREATE UNIQUE INDEX "Transaction_rfidReadSessionId_key" ON "Transaction"("rfidReadSessionId");
