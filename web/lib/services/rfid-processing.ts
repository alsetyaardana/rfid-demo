import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  LaundryBatchStatus,
  LinenStatus,
  OperationMode,
  ReaderType,
  TransactionType,
  ValidationStatus
} from "@/lib/domain/enums";
import { collapseDuplicateReads, normalizeEpc } from "@/lib/domain/epc";

export const processSessionInput = z.object({
  clientSessionId: z.string().min(1),
  readerId: z.string().min(1),
  readerType: z.nativeEnum(ReaderType),
  operationMode: z.nativeEnum(OperationMode),
  checkpoint: z.string().min(1),
  transactionType: z.nativeEnum(TransactionType),
  laundryBatchCode: z.string().optional(),
  sourceLocationCode: z.string().optional(),
  destinationLocationCode: z.string().optional(),
  confirm: z.boolean().default(false),
  reads: z.array(
    z.object({
      epc: z.string().min(1),
      rssi: z.number().int().optional(),
      antenna: z.string().optional()
    })
  )
});

export type ProcessSessionInput = z.infer<typeof processSessionInput>;

export type ProcessedSessionResult = {
  rawReadCount: number;
  uniqueTagCount: number;
  registeredCount: number;
  unknownCount: number;
  duplicateCount: number;
  acceptedCount: number;
  rejectedCount: number;
  transactionCode?: string;
  sessionId?: string;
  transactionId?: string;
  itemResults: Array<{
    epc: string;
    linenCode?: string;
    linenType?: string;
    validationStatus: ValidationStatus;
    previousStatus?: string;
    newStatus?: string;
    readCount: number;
  }>;
};

export type ProcessedSessionEnvelope = {
  idempotentReplay: boolean;
  result: ProcessedSessionResult;
};

type Tx = Prisma.TransactionClient | PrismaClient;

export async function processRfidReadSession(prisma: PrismaClient, unsafeInput: ProcessSessionInput): Promise<ProcessedSessionResult> {
  return (await processOrReplayRfidReadSession(prisma, unsafeInput)).result;
}

export async function processOrReplayRfidReadSession(prisma: PrismaClient, unsafeInput: ProcessSessionInput): Promise<ProcessedSessionEnvelope> {
  const input = processSessionInput.parse(unsafeInput);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.rFIDReadSession.findUnique({
      where: { clientSessionId: input.clientSessionId },
      include: { reads: true, transaction: { include: { items: { include: { linen: true } } } } }
    });

    if (existing) {
      return { idempotentReplay: true, result: replayResult(existing) };
    }

    return { idempotentReplay: false, result: await processInsideTransaction(tx, input) };
  });
}

async function processInsideTransaction(tx: Prisma.TransactionClient, input: ProcessSessionInput): Promise<ProcessedSessionResult> {
  const collapsed = collapseDuplicateReads(input.reads);
  const duplicateCount = input.reads.length - collapsed.length;
  const epcs = collapsed.map((read) => read.epc);

  const linens = await tx.linen.findMany({
    where: { epc: { in: epcs } },
    include: { currentLocation: true }
  });
  const linenByEpc = new Map(linens.map((linen) => [linen.epc, linen]));

  const batch = input.laundryBatchCode
    ? await tx.laundryBatch.findUnique({
        where: { batchCode: input.laundryBatchCode },
        include: { sourceLocation: true, destinationLocation: true, transactions: { include: { items: true } } }
      })
    : null;

  if ((input.transactionType === "SEND_TO_LAUNDRY" || input.transactionType === "RETURN_FROM_LAUNDRY") && !batch) {
    throw new Error("Laundry batch is required for this transaction.");
  }

  const itemResults = await validateItems(tx, input, collapsed, linenByEpc, batch);
  const accepted = itemResults.filter((item) => item.validationStatus === ValidationStatus.ACCEPTED);

  const session = await tx.rFIDReadSession.create({
    data: {
      clientSessionId: input.clientSessionId,
      readerId: input.readerId,
      readerType: input.readerType,
      operationMode: input.operationMode,
      checkpoint: input.checkpoint,
      transactionType: input.transactionType,
      rawReadCount: input.reads.length,
      uniqueTagCount: collapsed.length,
      reads: {
        create: itemResults.map((item) => ({
          epc: item.epc,
          rssi: item.rssi,
          readCount: item.readCount,
          antenna: item.antenna,
          validationStatus: item.validationStatus
        }))
      }
    }
  });

  let transactionCode: string | undefined;
  let sessionTransactionId: string | undefined;

  if (input.confirm) {
    const sourceLocation = await getLocation(tx, input.sourceLocationCode ?? batch?.sourceLocation.code);
    const destinationLocation = await getLocation(tx, input.destinationLocationCode ?? batch?.destinationLocation.code);
    const transaction = await createConfirmedTransaction(tx, input, itemResults, sourceLocation?.id, destinationLocation?.id, batch?.id, session.id);
    transactionCode = transaction.transactionCode;
    await applyInventoryUpdates(tx, input, accepted, destinationLocation?.id ?? batch?.destinationLocationId, batch?.id);
    sessionTransactionId = transaction.id;
  }

  return {
    sessionId: session.id,
    transactionId: sessionTransactionId,
    rawReadCount: input.reads.length,
    uniqueTagCount: collapsed.length,
    registeredCount: itemResults.filter((item) => item.linenId).length,
    unknownCount: itemResults.filter((item) => item.validationStatus === ValidationStatus.UNKNOWN_EPC).length,
    duplicateCount,
    acceptedCount: itemResults.filter((item) => item.validationStatus === ValidationStatus.ACCEPTED).length,
    rejectedCount: itemResults.filter((item) => item.validationStatus !== ValidationStatus.ACCEPTED).length,
    transactionCode,
    itemResults: itemResults.map(({ rssi, antenna, linenId, ...item }) => item)
  };
}

function replayResult(existing: {
  id: string;
  rawReadCount: number;
  uniqueTagCount: number;
  reads: Array<{ epc: string; readCount: number; validationStatus: string }>;
  transaction: null | {
    id: string;
    transactionCode: string;
    items: Array<{
      epc: string;
      validationStatus: string;
      previousStatus: string | null;
      newStatus: string | null;
      linen: null | { linenCode: string; linenType: string };
    }>;
  };
}): ProcessedSessionResult {
  const sourceItems: ProcessedSessionResult["itemResults"] = existing.transaction?.items.map((item) => ({
    epc: item.epc,
    linenCode: item.linen?.linenCode,
    linenType: item.linen?.linenType,
    validationStatus: item.validationStatus as ValidationStatus,
    previousStatus: item.previousStatus ?? undefined,
    newStatus: item.newStatus ?? undefined,
    readCount: existing.reads.find((read) => read.epc === item.epc)?.readCount ?? 1
  })) ?? existing.reads.map((read) => ({
    epc: read.epc,
    validationStatus: read.validationStatus as ValidationStatus,
    readCount: read.readCount
  }));

  return {
    sessionId: existing.id,
    transactionId: existing.transaction?.id,
    transactionCode: existing.transaction?.transactionCode,
    rawReadCount: existing.rawReadCount,
    uniqueTagCount: existing.uniqueTagCount,
    registeredCount: sourceItems.filter((item) => item.linenCode).length,
    unknownCount: sourceItems.filter((item) => item.validationStatus === ValidationStatus.UNKNOWN_EPC).length,
    duplicateCount: existing.rawReadCount - existing.uniqueTagCount,
    acceptedCount: sourceItems.filter((item) => item.validationStatus === ValidationStatus.ACCEPTED).length,
    rejectedCount: sourceItems.filter((item) => item.validationStatus !== ValidationStatus.ACCEPTED).length,
    itemResults: sourceItems
  };
}

async function validateItems(
  tx: Prisma.TransactionClient,
  input: ProcessSessionInput,
  reads: ReturnType<typeof collapseDuplicateReads>,
  linenByEpc: Map<string, Awaited<ReturnType<Tx["linen"]["findMany"]>>[number]>,
  batch: Awaited<ReturnType<Prisma.TransactionClient["laundryBatch"]["findUnique"]>>
) {
  const sentItems = batch
    ? await tx.transactionItem.findMany({
        where: {
          transaction: { laundryBatchId: batch.id, transactionType: TransactionType.SEND_TO_LAUNDRY },
          validationStatus: ValidationStatus.ACCEPTED
        }
      })
    : [];
  const returnedItems = batch
    ? await tx.transactionItem.findMany({
        where: {
          transaction: { laundryBatchId: batch.id, transactionType: TransactionType.RETURN_FROM_LAUNDRY },
          validationStatus: ValidationStatus.ACCEPTED
        }
      })
    : [];
  const sentEpcs = new Set(sentItems.map((item) => item.epc));
  const returnedEpcs = new Set(returnedItems.map((item) => item.epc));

  return reads.map((read) => {
    const linen = linenByEpc.get(read.epc);
    if (!linen) {
      return result(read, ValidationStatus.UNKNOWN_EPC);
    }

    if (input.transactionType === TransactionType.RETURN_FROM_LAUNDRY) {
      if (!sentEpcs.has(read.epc)) {
        return result(read, ValidationStatus.WRONG_BATCH, linen);
      }
      if (returnedEpcs.has(read.epc) || linen.currentStatus === LinenStatus.AVAILABLE) {
        return result(read, ValidationStatus.ALREADY_RETURNED, linen);
      }
    }

    return result(read, ValidationStatus.ACCEPTED, linen);
  });
}

function result(
  read: ReturnType<typeof collapseDuplicateReads>[number],
  validationStatus: ValidationStatus,
  linen?: {
    id: string;
    linenCode: string;
    linenType: string;
    currentStatus: string;
  }
) {
  const nextStatus =
    validationStatus !== ValidationStatus.ACCEPTED
      ? undefined
      : undefined;

  return {
    epc: read.epc,
    rssi: read.rssi,
    antenna: read.antenna,
    readCount: read.readCount,
    linenId: linen?.id,
    linenCode: linen?.linenCode,
    linenType: linen?.linenType,
    validationStatus,
    previousStatus: linen?.currentStatus,
    newStatus: nextStatus
  };
}

async function createConfirmedTransaction(
  tx: Prisma.TransactionClient,
  input: ProcessSessionInput,
  itemResults: Awaited<ReturnType<typeof validateItems>>,
  sourceLocationId?: string,
  destinationLocationId?: string,
  laundryBatchId?: string,
  rfidReadSessionId?: string
) {
  const count = await tx.transaction.count();
  const transactionCode = `TXN-${String(10001 + count).padStart(5, "0")}`;
  const newStatus = input.transactionType === TransactionType.SEND_TO_LAUNDRY ? LinenStatus.IN_LAUNDRY :
    input.transactionType === TransactionType.RETURN_FROM_LAUNDRY ? LinenStatus.AVAILABLE : undefined;

  const transaction = await tx.transaction.create({
    data: {
      transactionCode,
      transactionType: input.transactionType,
      laundryBatchId,
      readerId: input.readerId,
      operationMode: input.operationMode,
      sourceLocationId,
      destinationLocationId,
      rfidReadSessionId,
      items: {
        create: itemResults.map((item) => ({
          linenId: item.linenId,
          epc: item.epc,
          previousStatus: item.previousStatus,
          newStatus: item.validationStatus === ValidationStatus.ACCEPTED ? newStatus : undefined,
          validationStatus: item.validationStatus
        }))
      }
    }
  });

  return { id: transaction.id, transactionCode };
}

async function applyInventoryUpdates(
  tx: Prisma.TransactionClient,
  input: ProcessSessionInput,
  accepted: Awaited<ReturnType<typeof validateItems>>,
  destinationLocationId?: string,
  batchId?: string
) {
  const now = new Date();

  if (input.transactionType === TransactionType.SEND_TO_LAUNDRY) {
    for (const item of accepted) {
      if (!item.linenId) continue;
      await tx.linen.update({
        where: { id: item.linenId },
        data: {
          currentStatus: LinenStatus.IN_LAUNDRY,
          currentLocationId: destinationLocationId,
          lastScannedAt: now
        }
      });
    }
    if (batchId) {
      await tx.laundryBatch.update({ where: { id: batchId }, data: { status: LaundryBatchStatus.SENT } });
    }
    return;
  }

  if (input.transactionType === TransactionType.RETURN_FROM_LAUNDRY) {
    for (const item of accepted) {
      if (!item.linenId) continue;
      await tx.linen.update({
        where: { id: item.linenId },
        data: {
          currentStatus: LinenStatus.AVAILABLE,
          currentLocationId: destinationLocationId,
          laundryCycleCount: { increment: 1 },
          lastScannedAt: now
        }
      });
    }

    if (batchId) {
      const reconciliation = await calculateReconciliation(tx, batchId);
      await tx.laundryBatch.update({
        where: { id: batchId },
        data: {
          status: reconciliation.outstandingCount > 0 ? LaundryBatchStatus.RECONCILIATION_REQUIRED : LaundryBatchStatus.COMPLETED,
          completedAt: reconciliation.outstandingCount > 0 ? null : now
        }
      });
    }
  }
}

export async function calculateBatchReconciliation(prisma: PrismaClient, batchCode: string) {
  const batch = await prisma.laundryBatch.findUnique({ where: { batchCode } });
  if (!batch) throw new Error(`Batch ${batchCode} not found`);
  return calculateReconciliation(prisma, batch.id);
}

async function calculateReconciliation(tx: Tx, batchId: string) {
  const sentItems = await tx.transactionItem.findMany({
    where: {
      transaction: { laundryBatchId: batchId, transactionType: TransactionType.SEND_TO_LAUNDRY },
      validationStatus: ValidationStatus.ACCEPTED
    },
    include: { linen: true }
  });
  const returnedItems = await tx.transactionItem.findMany({
    where: {
      transaction: { laundryBatchId: batchId, transactionType: TransactionType.RETURN_FROM_LAUNDRY },
      validationStatus: ValidationStatus.ACCEPTED
    }
  });

  const returnedEpcs = new Set(returnedItems.map((item) => item.epc));
  const outstanding = sentItems.filter((item) => !returnedEpcs.has(item.epc));

  return {
    sentCount: sentItems.length,
    returnedCount: returnedItems.length,
    outstandingCount: outstanding.length,
    outstandingItems: outstanding.map((item) => ({
      linenCode: item.linen?.linenCode ?? "Unknown",
      epc: item.epc,
      linenType: item.linen?.linenType ?? "Unknown",
      lastKnownLocation: "Laundry Dispatch Gate",
      lastReader: "FX-LDY-02"
    }))
  };
}

async function getLocation(tx: Prisma.TransactionClient, code?: string) {
  if (!code) return null;
  return tx.location.findUnique({ where: { code } });
}

export function buildDemoReads(epcs: string[], options: { duplicates?: boolean; unknown?: boolean } = {}) {
  const reads = epcs.map((epc, index) => ({
    epc: index % 2 === 0 ? epc : epc.replace("EPC", "epc-"),
    rssi: -48 - index,
    antenna: "ANT-1"
  }));

  if (options.duplicates) {
    reads.push({ epc: epcs[0], rssi: -51, antenna: "ANT-1" });
    reads.push({ epc: ` ${epcs[1].slice(0, 3)}-${epcs[1].slice(3)} `, rssi: -53, antenna: "ANT-2" });
  }

  if (options.unknown) {
    reads.push({ epc: "unknown-epc-9999", rssi: -76, antenna: "ANT-3" });
  }

  return reads.map((read) => ({ ...read, epc: normalizeEpc(read.epc) }));
}
