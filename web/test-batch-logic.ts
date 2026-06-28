/**
 * Validation test: Dynamic Laundry Batch and Reconciliation Logic Fix
 * Clones simulation.db schema into test-batch.db (never modifies runtime DBs).
 * Run from web/:  npx tsx test-batch-logic.ts
 */
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const PRISMA_DIR = path.join(__dirname, "prisma");
const TEST_DB_PATH = path.join(PRISMA_DIR, "test-batch.db");
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

function setupTestDb() {
  // Clone simulation.db (schema-only copy) to get the same schema
  for (const ext of ["", "-shm", "-wal"]) {
    try { fs.unlinkSync(TEST_DB_PATH + ext); } catch { /* ok */ }
  }
  fs.copyFileSync(path.join(PRISMA_DIR, "simulation.db"), TEST_DB_PATH);
}

let pass = 0;
let fail = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✓ ${label}: ${actual}`);
    pass++;
  } else {
    console.error(`  ✗ ${label}: expected ${expected}, got ${actual}`);
    fail++;
  }
}

async function main() {
  setupTestDb();

  // datasources override bypasses whatever DATABASE_URL dotenv loaded
  const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

  // Wipe all data from the cloned DB (keep schema)
  await prisma.$transaction([
    prisma.transactionItem.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.rFIDRead.deleteMany(),
    prisma.rFIDReadSession.deleteMany(),
    prisma.laundryBatch.deleteMany(),
    prisma.linen.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.location.deleteMany()
  ]);

  const { processRfidReadSession, calculateBatchReconciliation } = await import("@/lib/services/rfid-processing");
  const { ReaderType, OperationMode, TransactionType } = await import("@/lib/domain/enums");

  console.log("=== Batch Logic Validation Test ===\n");

  // ── Seed ────────────────────────────────────────────────────────────────
  await prisma.location.createMany({
    data: [
      { code: "LINEN-RM", name: "Linen Room", locationType: "INTERNAL" },
      { code: "EXT-LDY", name: "External Laundry", locationType: "EXTERNAL" }
    ]
  });
  const linenRoom = await prisma.location.findUniqueOrThrow({ where: { code: "LINEN-RM" } });
  await prisma.linen.createMany({
    data: [
      { linenCode: "LN001", epc: "EPC001", linenType: "SHEET", currentStatus: "AVAILABLE", currentLocationId: linenRoom.id },
      { linenCode: "LN002", epc: "EPC002", linenType: "TOWEL", currentStatus: "AVAILABLE", currentLocationId: linenRoom.id },
      { linenCode: "LN003", epc: "EPC003", linenType: "PILLOW", currentStatus: "AVAILABLE", currentLocationId: linenRoom.id },
      { linenCode: "LN004", epc: "EPC004", linenType: "SHEET", currentStatus: "AVAILABLE", currentLocationId: linenRoom.id },
      { linenCode: "LN005", epc: "EPC005", linenType: "TOWEL", currentStatus: "AVAILABLE", currentLocationId: linenRoom.id }
    ]
  });

  function session(id: string, type: typeof TransactionType[keyof typeof TransactionType], batchCode: string, epcs: string[]) {
    return {
      clientSessionId: id,
      readerId: "TEST",
      readerType: ReaderType.HANDHELD,
      operationMode: OperationMode.MANUAL,
      checkpoint: "TEST",
      transactionType: type,
      laundryBatchCode: batchCode,
      sourceLocationCode: type === TransactionType.RETURN_FROM_LAUNDRY ? "EXT-LDY" : "LINEN-RM",
      destinationLocationCode: type === TransactionType.RETURN_FROM_LAUNDRY ? "LINEN-RM" : "EXT-LDY",
      confirm: true,
      reads: epcs.map((epc) => ({ epc, rssi: -50 }))
    };
  }

  // ── BATCH A: send → partial return → full return ─────────────────────────
  console.log("Batch A: SEND 3 linens (find-or-create new batch)");
  await processRfidReadSession(prisma, session("S-A-1", TransactionType.SEND_TO_LAUNDRY, "LB-TEST-A", ["EPC001", "EPC002", "EPC003"]));
  const ra1 = await calculateBatchReconciliation(prisma, "LB-TEST-A");
  assert("A sentCount after send", ra1.sentCount, 3);
  assert("A returnedCount after send", ra1.returnedCount, 0);
  assert("A outstandingCount after send", ra1.outstandingCount, 3);

  console.log("\nBatch A: partial RETURN (LN001 only)");
  await processRfidReadSession(prisma, session("R-A-1", TransactionType.RETURN_FROM_LAUNDRY, "LB-TEST-A", ["EPC001"]));
  const ra2 = await calculateBatchReconciliation(prisma, "LB-TEST-A");
  assert("A sentCount after partial return", ra2.sentCount, 3);
  assert("A returnedCount after partial return", ra2.returnedCount, 1);
  assert("A outstandingCount after partial return", ra2.outstandingCount, 2);

  console.log("\nBatch A: full RETURN (LN002, LN003)");
  await processRfidReadSession(prisma, session("R-A-2", TransactionType.RETURN_FROM_LAUNDRY, "LB-TEST-A", ["EPC002", "EPC003"]));
  const ra3 = await calculateBatchReconciliation(prisma, "LB-TEST-A");
  assert("A sentCount after full return", ra3.sentCount, 3);
  assert("A returnedCount after full return", ra3.returnedCount, 3);
  assert("A outstandingCount after full return", ra3.outstandingCount, 0);

  // ── BATCH B: independent ─────────────────────────────────────────────────
  console.log("\nBatch B: SEND 2 linens (independent of A)");
  await processRfidReadSession(prisma, session("S-B-1", TransactionType.SEND_TO_LAUNDRY, "LB-TEST-B", ["EPC004", "EPC005"]));
  const rb1 = await calculateBatchReconciliation(prisma, "LB-TEST-B");
  assert("B sentCount after send", rb1.sentCount, 2);
  assert("B outstandingCount after send", rb1.outstandingCount, 2);

  console.log("\nBatch B: wrong-batch RETURN (EPC001 from A — now AVAILABLE → WRONG_BATCH)");
  const wrongResult = await processRfidReadSession(prisma, session("R-B-WRONG", TransactionType.RETURN_FROM_LAUNDRY, "LB-TEST-B", ["EPC001"]));
  const wrongItem = wrongResult.itemResults.find((i) => i.epc === "EPC001");
  assert("wrong-batch item status", wrongItem?.validationStatus, "WRONG_BATCH");
  const rb2 = await calculateBatchReconciliation(prisma, "LB-TEST-B");
  assert("B outstandingCount unchanged after wrong-batch attempt", rb2.outstandingCount, 2);

  console.log("\nBatch B: correct RETURN (LN004 only)");
  await processRfidReadSession(prisma, session("R-B-1", TransactionType.RETURN_FROM_LAUNDRY, "LB-TEST-B", ["EPC004"]));
  const rb3 = await calculateBatchReconciliation(prisma, "LB-TEST-B");
  assert("B outstandingCount after partial return", rb3.outstandingCount, 1);

  const raFinal = await calculateBatchReconciliation(prisma, "LB-TEST-A");
  assert("A outstandingCount independent — still 0", raFinal.outstandingCount, 0);

  // ── Hardware batch — no LB-DEMO-001 dependency ──────────────────────────
  console.log("\nHardware batch LB-HW-99 (no LB-DEMO-001 dependency)");
  await processRfidReadSession(prisma, session("S-HW-1", TransactionType.SEND_TO_LAUNDRY, "LB-HW-99", ["EPC005"]));
  const rhw = await calculateBatchReconciliation(prisma, "LB-HW-99");
  assert("HW batch sentCount", rhw.sentCount, 1);
  assert("HW batch outstandingCount", rhw.outstandingCount, 1);

  await prisma.$disconnect();
  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
