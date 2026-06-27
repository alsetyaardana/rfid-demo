-- CreateTable
CREATE TABLE "Linen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linenCode" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "linenType" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "currentLocationId" TEXT NOT NULL,
    "laundryCycleCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Linen_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationType" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LaundryBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchCode" TEXT NOT NULL,
    "sourceLocationId" TEXT NOT NULL,
    "destinationLocationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "LaundryBatch_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaundryBatch_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionCode" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "laundryBatchId" TEXT,
    "readerId" TEXT NOT NULL,
    "operationMode" TEXT NOT NULL,
    "sourceLocationId" TEXT,
    "destinationLocationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_laundryBatchId_fkey" FOREIGN KEY ("laundryBatchId") REFERENCES "LaundryBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "linenId" TEXT,
    "epc" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "validationStatus" TEXT NOT NULL,
    CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionItem_linenId_fkey" FOREIGN KEY ("linenId") REFERENCES "Linen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RFIDReadSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientSessionId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "readerType" TEXT NOT NULL,
    "operationMode" TEXT NOT NULL,
    "checkpoint" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "rawReadCount" INTEGER NOT NULL,
    "uniqueTagCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RFIDRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "rssi" INTEGER NOT NULL,
    "readCount" INTEGER NOT NULL,
    "antenna" TEXT,
    "validationStatus" TEXT NOT NULL,
    CONSTRAINT "RFIDRead_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RFIDReadSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetCode" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "currentLocationId" TEXT NOT NULL,
    CONSTRAINT "Asset_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Linen_linenCode_key" ON "Linen"("linenCode");

-- CreateIndex
CREATE UNIQUE INDEX "Linen_epc_key" ON "Linen"("epc");

-- CreateIndex
CREATE INDEX "Linen_currentStatus_idx" ON "Linen"("currentStatus");

-- CreateIndex
CREATE INDEX "Linen_currentLocationId_idx" ON "Linen"("currentLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LaundryBatch_batchCode_key" ON "LaundryBatch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionCode_key" ON "Transaction"("transactionCode");

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionItem_linenId_idx" ON "TransactionItem"("linenId");

-- CreateIndex
CREATE INDEX "TransactionItem_epc_idx" ON "TransactionItem"("epc");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDReadSession_clientSessionId_key" ON "RFIDReadSession"("clientSessionId");

-- CreateIndex
CREATE INDEX "RFIDRead_sessionId_idx" ON "RFIDRead"("sessionId");

-- CreateIndex
CREATE INDEX "RFIDRead_epc_idx" ON "RFIDRead"("epc");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "Asset"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_epc_key" ON "Asset"("epc");
