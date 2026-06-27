"use server";

import { revalidatePath } from "next/cache";
import { OperationMode, ReaderType, TransactionType } from "@/lib/domain/enums";
import { activeDemoReturnEpcs, activeDemoSendEpcs, demoBatchCode } from "@/lib/domain/demo-data";
import { prisma } from "@/lib/db";
import { buildDemoReads, processRfidReadSession } from "@/lib/services/rfid-processing";
import { resetDemoData } from "@/lib/services/reset-demo";

const revalidateAll = () => {
  ["/", "/rfid-scan", "/linen-master", "/laundry-batches", "/reconciliation", "/device-activity", "/transaction-history", "/asset-management"].forEach((path) => revalidatePath(path));
};

export async function resetDemoAction() {
  await resetDemoData(prisma);
  revalidateAll();
}

export async function simulateSendToLaundryAction() {
  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-SEND-${Date.now()}`,
    readerId: "HH-MGR-04",
    readerType: ReaderType.HANDHELD,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Laundry Dispatch Gate",
    transactionType: TransactionType.SEND_TO_LAUNDRY,
    laundryBatchCode: demoBatchCode,
    sourceLocationCode: "LINEN-RM",
    destinationLocationCode: "EXT-LDY",
    confirm: true,
    reads: buildDemoReads(activeDemoSendEpcs, { duplicates: true })
  });
  revalidateAll();
  return result;
}

export async function simulateReturnFromLaundryAction() {
  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-RETURN-${Date.now()}`,
    readerId: "HH-MGR-04",
    readerType: ReaderType.HANDHELD,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Laundry Return Desk",
    transactionType: TransactionType.RETURN_FROM_LAUNDRY,
    laundryBatchCode: demoBatchCode,
    sourceLocationCode: "EXT-LDY",
    destinationLocationCode: "LINEN-RM",
    confirm: true,
    reads: buildDemoReads(activeDemoReturnEpcs, { duplicates: true })
  });
  revalidateAll();
  return result;
}

export async function simulateUnknownReadAction() {
  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-UNKNOWN-${Date.now()}`,
    readerId: "SIM-WEB-01",
    readerType: ReaderType.SIMULATOR,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Main Linen Room",
    transactionType: TransactionType.STOCK_COUNT,
    sourceLocationCode: "LINEN-RM",
    confirm: false,
    reads: buildDemoReads(activeDemoSendEpcs.slice(0, 3), { duplicates: true, unknown: true })
  });
  revalidateAll();
  return result;
}

export async function simulateFixedReaderAction() {
  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-FIXED-${Date.now()}`,
    readerId: "FX-LDY-02",
    readerType: ReaderType.FIXED_READER_EMULATOR,
    operationMode: OperationMode.AUTOMATIC,
    checkpoint: "Laundry Dispatch Gate",
    transactionType: TransactionType.SEND_TO_LAUNDRY,
    laundryBatchCode: demoBatchCode,
    sourceLocationCode: "LINEN-RM",
    destinationLocationCode: "EXT-LDY",
    confirm: true,
    reads: buildDemoReads(activeDemoSendEpcs, { duplicates: true })
  });
  revalidateAll();
  return result;
}
