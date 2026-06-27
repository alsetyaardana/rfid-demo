import { beforeEach, describe, expect, it } from "vitest";
import { OperationMode, ReaderType, TransactionType, ValidationStatus } from "@/lib/domain/enums";
import { activeDemoReturnEpcs, activeDemoSendEpcs, demoBatchCode } from "@/lib/domain/demo-data";
import { collapseDuplicateReads, normalizeEpc } from "@/lib/domain/epc";
import { getDb } from "@/lib/db";
const prisma = getDb("SIMULATION");
import { buildDemoReads, calculateBatchReconciliation, processRfidReadSession } from "@/lib/services/rfid-processing";
import { resetDemoData } from "@/lib/services/reset-demo";

describe("RFID processing", () => {
  beforeEach(async () => {
    await resetDemoData(prisma);
  });

  it("normalizes EPC values", () => {
    expect(normalizeEpc(" epc-3008:0001 ")).toBe("EPC30080001");
  });

  it("collapses duplicate reads", () => {
    const collapsed = collapseDuplicateReads([
      { epc: "epc-3008-0001", rssi: -60 },
      { epc: " EPC30080001 ", rssi: -48 },
      { epc: "EPC30080002", rssi: -52 }
    ]);
    expect(collapsed).toHaveLength(2);
    expect(collapsed[0]).toMatchObject({ epc: "EPC30080001", readCount: 2, rssi: -48 });
  });

  it("handles unknown EPC values without registration", async () => {
    const result = await processRfidReadSession(prisma, baseInput({
      clientSessionId: "TEST-UNKNOWN",
      transactionType: TransactionType.STOCK_COUNT,
      confirm: false,
      reads: buildDemoReads(activeDemoSendEpcs.slice(0, 2), { unknown: true })
    }));

    expect(result.unknownCount).toBe(1);
    expect(result.itemResults.some((item) => item.validationStatus === ValidationStatus.UNKNOWN_EPC)).toBe(true);
    await expect(prisma.linen.findUnique({ where: { epc: "UNKNOWNEPC9999" } })).resolves.toBeNull();
  });

  it("processes a valid send-to-laundry transaction", async () => {
    const result = await sendEight();
    expect(result.acceptedCount).toBe(8);

    const inLaundry = await prisma.linen.count({ where: { epc: { in: activeDemoSendEpcs }, currentStatus: "IN_LAUNDRY" } });
    expect(inLaundry).toBe(8);
  });

  it("processes a valid return transaction", async () => {
    await sendEight();
    const result = await returnSeven();
    expect(result.acceptedCount).toBe(7);

    const available = await prisma.linen.count({ where: { epc: { in: activeDemoReturnEpcs }, currentStatus: "AVAILABLE" } });
    expect(available).toBe(7);
  });

  it("rejects return from the wrong batch", async () => {
    const result = await processRfidReadSession(prisma, baseInput({
      clientSessionId: "TEST-WRONG-BATCH",
      transactionType: TransactionType.RETURN_FROM_LAUNDRY,
      laundryBatchCode: demoBatchCode,
      sourceLocationCode: "EXT-LDY",
      destinationLocationCode: "LINEN-RM",
      confirm: true,
      reads: buildDemoReads([activeDemoSendEpcs[0]])
    }));

    expect(result.itemResults[0].validationStatus).toBe(ValidationStatus.WRONG_BATCH);
    expect(result.acceptedCount).toBe(0);
  });

  it("prevents repeated returns", async () => {
    await sendEight();
    await returnSeven();
    const secondReturn = await returnSeven("TEST-RETURN-AGAIN");

    expect(secondReturn.acceptedCount).toBe(0);
    expect(secondReturn.itemResults.every((item) => item.validationStatus === ValidationStatus.ALREADY_RETURNED)).toBe(true);
  });

  it("calculates laundry reconciliation from transaction items", async () => {
    await sendEight();
    await returnSeven();
    const reconciliation = await calculateBatchReconciliation(prisma, demoBatchCode);

    expect(reconciliation).toMatchObject({ sentCount: 8, returnedCount: 7, outstandingCount: 1 });
    expect(reconciliation.outstandingItems[0]).toMatchObject({ epc: activeDemoSendEpcs[7] });
  });

  it("resets demo data", async () => {
    await sendEight();
    await returnSeven();
    await resetDemoData(prisma);

    expect(await prisma.transaction.count()).toBe(0);
    expect(await prisma.rFIDReadSession.count()).toBe(0);
    expect(await prisma.linen.count()).toBe(12);
    expect(await prisma.laundryBatch.findUnique({ where: { batchCode: demoBatchCode } })).not.toBeNull();
  });
});

function baseInput(overrides: Partial<Parameters<typeof processRfidReadSession>[1]>) {
  return {
    clientSessionId: "TEST-SESSION",
    readerId: "HH-MGR-04",
    readerType: ReaderType.HANDHELD,
    operationMode: OperationMode.WEBSITE_SIMULATION,
    checkpoint: "Laundry Dispatch Gate",
    transactionType: TransactionType.SEND_TO_LAUNDRY,
    laundryBatchCode: demoBatchCode,
    sourceLocationCode: "LINEN-RM",
    destinationLocationCode: "EXT-LDY",
    confirm: true,
    reads: buildDemoReads(activeDemoSendEpcs),
    ...overrides
  };
}

function sendEight(sessionId = "TEST-SEND") {
  return processRfidReadSession(prisma, baseInput({
    clientSessionId: sessionId,
    transactionType: TransactionType.SEND_TO_LAUNDRY,
    sourceLocationCode: "LINEN-RM",
    destinationLocationCode: "EXT-LDY",
    reads: buildDemoReads(activeDemoSendEpcs, { duplicates: true })
  }));
}

function returnSeven(sessionId = "TEST-RETURN") {
  return processRfidReadSession(prisma, baseInput({
    clientSessionId: sessionId,
    transactionType: TransactionType.RETURN_FROM_LAUNDRY,
    sourceLocationCode: "EXT-LDY",
    destinationLocationCode: "LINEN-RM",
    reads: buildDemoReads(activeDemoReturnEpcs, { duplicates: true })
  }));
}
