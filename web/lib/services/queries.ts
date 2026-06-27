import { TransactionType, ValidationStatus } from "@/lib/domain/enums";
import { demoBatchCode } from "@/lib/domain/demo-data";
import { getDb } from "@/lib/db";
import { calculateBatchReconciliation } from "@/lib/services/rfid-processing";

export async function getDashboardData() {
  const prisma = getDb();
  const [linenCounts, batch, sessions, transactions] = await Promise.all([
    prisma.linen.groupBy({ by: ["currentStatus"], _count: true }),
    prisma.laundryBatch.findUnique({ where: { batchCode: demoBatchCode } }),
    prisma.rFIDReadSession.count(),
    prisma.transaction.count()
  ]);
  const reconciliation = await safeReconciliation(prisma);

  return {
    linenCounts: Object.fromEntries(linenCounts.map((row) => [row.currentStatus, row._count])),
    batch,
    sessionCount: sessions,
    transactionCount: transactions,
    reconciliation
  };
}

export async function getLinenMasterData() {
  const prisma = getDb();
  return prisma.linen.findMany({
    include: { currentLocation: true },
    orderBy: { linenCode: "asc" }
  });
}

export async function getLaundryBatchData() {
  const prisma = getDb();
  return prisma.laundryBatch.findMany({
    include: {
      sourceLocation: true,
      destinationLocation: true,
      transactions: { include: { items: true }, orderBy: { createdAt: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getReconciliationData() {
  const prisma = getDb();
  const batch = await prisma.laundryBatch.findUnique({
    where: { batchCode: demoBatchCode },
    include: { sourceLocation: true, destinationLocation: true }
  });
  const reconciliation = await safeReconciliation(prisma);
  return { batch, reconciliation };
}

export async function getDeviceActivityData() {
  const prisma = getDb();
  return prisma.rFIDReadSession.findMany({
    include: { reads: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getTransactionHistoryData() {
  const prisma = getDb();
  return prisma.transaction.findMany({
    include: {
      laundryBatch: true,
      items: { include: { linen: true } },
      sourceLocation: true,
      destinationLocation: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAssetData() {
  const prisma = getDb();
  return prisma.asset.findMany({
    include: { currentLocation: true },
    orderBy: { assetCode: "asc" }
  });
}

export async function getRfidScanData() {
  const prisma = getDb();
  const [batch, locations, latestSessions] = await Promise.all([
    prisma.laundryBatch.findUnique({ where: { batchCode: demoBatchCode } }),
    prisma.location.findMany({ orderBy: { code: "asc" } }),
    prisma.rFIDReadSession.findMany({ include: { reads: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);
  return { batch, locations, latestSessions };
}

async function safeReconciliation(prisma: any) {
  try {
    return await calculateBatchReconciliation(prisma, demoBatchCode);
  } catch {
    return {
      sentCount: 0,
      returnedCount: 0,
      outstandingCount: 0,
      outstandingItems: []
    };
  }
}

export async function getSentReturnSummary(batchId: string) {
  const prisma = getDb();
  const sent = await prisma.transactionItem.count({
    where: {
      transaction: { laundryBatchId: batchId, transactionType: TransactionType.SEND_TO_LAUNDRY },
      validationStatus: ValidationStatus.ACCEPTED
    }
  });
  const returned = await prisma.transactionItem.count({
    where: {
      transaction: { laundryBatchId: batchId, transactionType: TransactionType.RETURN_FROM_LAUNDRY },
      validationStatus: ValidationStatus.ACCEPTED
    }
  });
  return { sent, returned, outstanding: Math.max(sent - returned, 0) };
}
