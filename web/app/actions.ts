"use server";

import { revalidatePath } from "next/cache";
import { OperationMode, ReaderType, TransactionType, ValidationStatus } from "@/lib/domain/enums";
import { getDb } from "@/lib/db";
import { buildDemoReads, processRfidReadSession } from "@/lib/services/rfid-processing";
import { resetSimulationDatabase, generateSimulationData, clearSimulationData, checkRecordLimits } from "@/lib/services/simulation";
import { LaundryBatchStatus, LinenStatus } from "@/lib/domain/enums";
import { normalizeEpc } from "@/lib/domain/epc";
import { headers } from "next/headers";

const revalidateAll = () => {
  ["/", "/rfid-scan", "/linen-master", "/laundry-batches", "/reconciliation", "/device-activity", "/transaction-history", "/asset-management"].forEach((path) => revalidatePath(path));
};

export async function resetDemoAction() {
  const prisma = getDb("SIMULATION");
  await resetSimulationDatabase(prisma);
  revalidateAll();
}

export async function clearDemoAction() {
  const prisma = getDb("SIMULATION");
  await clearSimulationData(prisma);
  revalidateAll();
}

export async function generateDemoAction(quantity: number) {
  const prisma = getDb("SIMULATION");
  await generateSimulationData(prisma, quantity);
  revalidateAll();
}

export async function simulateSendToLaundryAction() {
  const prisma = getDb("SIMULATION");
  
  // Find up to 10 available linens to send
  const availableLinens = await prisma.linen.findMany({
    where: { currentStatus: LinenStatus.AVAILABLE },
    take: 10
  });
  
  if (availableLinens.length === 0) {
    throw new Error("No available linen found. Generate data first.");
  }

  const epcs = availableLinens.map(l => l.epc);
  const batchCode = `LB-SIM-${Date.now()}`;

  // Create a new batch dynamically
  const source = await prisma.location.findUnique({ where: { code: "LINEN-RM" }});
  const destination = await prisma.location.findUnique({ where: { code: "EXT-LDY" }});
  if (source && destination) {
    await prisma.laundryBatch.create({
      data: {
        batchCode,
        status: LaundryBatchStatus.CREATED,
        sourceLocationId: source.id,
        destinationLocationId: destination.id
      }
    });
  }

  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-SEND-${Date.now()}`,
    readerId: "HH-MGR-04",
    readerType: ReaderType.HANDHELD,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Laundry Dispatch Gate",
    transactionType: TransactionType.SEND_TO_LAUNDRY,
    laundryBatchCode: batchCode,
    sourceLocationCode: "LINEN-RM",
    destinationLocationCode: "EXT-LDY",
    confirm: true,
    reads: buildDemoReads(epcs, { duplicates: true })
  });
  revalidateAll();
  return result;
}

export async function simulateReturnFromLaundryAction() {
  const prisma = getDb("SIMULATION");
  
  // Find the latest active batch
  const batch = await prisma.laundryBatch.findFirst({
    where: { status: LaundryBatchStatus.SENT },
    orderBy: { createdAt: 'desc' }
  });

  if (!batch) {
    throw new Error("No active sent batch found to return.");
  }

  // Find linens that were sent in this batch
  const sentItems = await prisma.transactionItem.findMany({
    where: {
      transaction: { laundryBatchId: batch.id, transactionType: TransactionType.SEND_TO_LAUNDRY }
    }
  });

  if (sentItems.length === 0) {
    throw new Error("No items found in the batch to return.");
  }

  // Return all except one to simulate outstanding item, unless there's only 1
  const returnCount = Math.max(1, sentItems.length - 1);
  const epcs = sentItems.slice(0, returnCount).map(item => item.epc);

  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-RETURN-${Date.now()}`,
    readerId: "HH-MGR-04",
    readerType: ReaderType.HANDHELD,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Laundry Return Desk",
    transactionType: TransactionType.RETURN_FROM_LAUNDRY,
    laundryBatchCode: batch.batchCode,
    sourceLocationCode: "EXT-LDY",
    destinationLocationCode: "LINEN-RM",
    confirm: true,
    reads: buildDemoReads(epcs, { duplicates: true })
  });
  revalidateAll();
  return result;
}

export async function simulateUnknownReadAction() {
  const prisma = getDb("SIMULATION");
  
  // Find a few available linens to mix with unknown
  const availableLinens = await prisma.linen.findMany({
    where: { currentStatus: LinenStatus.AVAILABLE },
    take: 3
  });
  const epcs = availableLinens.map(l => l.epc);
  
  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-UNKNOWN-${Date.now()}`,
    readerId: "SIM-WEB-01",
    readerType: ReaderType.SIMULATOR,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Main Linen Room",
    transactionType: TransactionType.STOCK_COUNT,
    sourceLocationCode: "LINEN-RM",
    confirm: false,
    reads: buildDemoReads(epcs, { duplicates: true, unknown: true })
  });
  revalidateAll();
  return result;
}

export async function simulateFixedReaderAction() {
  const prisma = getDb("SIMULATION");
  
  const availableLinens = await prisma.linen.findMany({
    where: { currentStatus: LinenStatus.AVAILABLE },
    take: 5
  });
  if (availableLinens.length === 0) {
    throw new Error("No available linen found.");
  }
  
  const epcs = availableLinens.map(l => l.epc);
  const batchCode = `LB-SIM-${Date.now()}`;
  
  const source = await prisma.location.findUnique({ where: { code: "LINEN-RM" }});
  const destination = await prisma.location.findUnique({ where: { code: "EXT-LDY" }});
  if (source && destination) {
    await prisma.laundryBatch.create({
      data: {
        batchCode,
        status: LaundryBatchStatus.CREATED,
        sourceLocationId: source.id,
        destinationLocationId: destination.id
      }
    });
  }

  const result = await processRfidReadSession(prisma, {
    clientSessionId: `WEB-FIXED-${Date.now()}`,
    readerId: "FX-LDY-02",
    readerType: ReaderType.FIXED_READER_EMULATOR,
    operationMode: OperationMode.AUTOMATIC,
    checkpoint: "Laundry Dispatch Gate",
    transactionType: TransactionType.SEND_TO_LAUNDRY,
    laundryBatchCode: batchCode,
    sourceLocationCode: "LINEN-RM",
    destinationLocationCode: "EXT-LDY",
    confirm: true,
    reads: buildDemoReads(epcs, { duplicates: true })
  });
  revalidateAll();
  return result;
}

export async function registerPhysicalEpcAction(epc: string, linenCode: string, linenType: string) {
  const mode = headers().get("x-demo-mode") || "SIMULATION";
  if (mode !== "HARDWARE") {
    throw new Error("Physical EPC registration is only allowed in Hardware mode.");
  }

  const prisma = getDb("HARDWARE");

  const normalizedEpc = normalizeEpc(epc);
  if (!normalizedEpc) {
    throw new Error("Invalid EPC format.");
  }
  
  const trimmedLinenCode = linenCode.trim();
  if (!trimmedLinenCode) {
    throw new Error("Linen Code is required.");
  }
  if (!linenType.trim()) {
    throw new Error("Linen Type is required.");
  }

  // Enforce limit using the shared logic logic (but pointed at hardware db)
  await checkRecordLimits(prisma, 'linen', 1);

  // Uniqueness check
  const existingEpc = await prisma.linen.findUnique({ where: { epc: normalizedEpc } });
  if (existingEpc) {
    throw new Error("This EPC is already registered.");
  }

  const existingCode = await prisma.linen.findUnique({ where: { linenCode: trimmedLinenCode } });
  if (existingCode) {
    throw new Error("This Linen Code is already in use.");
  }

  // Get Linen Room location
  const location = await prisma.location.findUnique({ where: { code: "LINEN-RM" } });
  if (!location) {
    throw new Error("Base infrastructure missing. Cannot find LINEN-RM.");
  }

  // Create
  const linen = await prisma.linen.create({
    data: {
      epc: normalizedEpc,
      linenCode: trimmedLinenCode,
      linenType: linenType.trim(),
      currentStatus: LinenStatus.AVAILABLE,
      currentLocationId: location.id,
      laundryCycleCount: 0
    }
  });

  revalidateAll();
  return linen;
}

export async function dismissUnknownEpcAction(epc: string) {
  // To dismiss, we can simply delete the specific RFIDRead records that have this EPC and are UNKNOWN_EPC
  // in the current mode (HARDWARE) so they disappear from the UI.
  const prisma = getDb("HARDWARE");
  await prisma.rFIDRead.deleteMany({
    where: {
      epc: epc,
      validationStatus: ValidationStatus.UNKNOWN_EPC
    }
  });
  revalidateAll();
}
