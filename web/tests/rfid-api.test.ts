import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/rfid/read-sessions/route";
import { GET } from "@/app/api/rfid/read-sessions/[id]/route";
import { activeDemoReturnEpcs, activeDemoSendEpcs, demoBatchCode } from "@/lib/domain/demo-data";
import { getDb } from "@/lib/db";
const prisma = getDb("SIMULATION");
import { calculateBatchReconciliation } from "@/lib/services/rfid-processing";
import { resetDemoData } from "@/lib/services/reset-demo";

const apiKey = "test-rfid-api-key";

describe("RFID HTTP API", () => {
  beforeEach(async () => {
    process.env.RFID_API_KEY = apiKey;
    await resetDemoData(prisma);
  });

  it("accepts a valid API key", async () => {
    const response = await post(payload({ clientSessionId: "API-KEY-VALID", transactionType: "STOCK_COUNT", epcs: [activeDemoSendEpcs[0]] }));
    expect(response.status).toBe(200);
  });

  it("rejects a missing API key", async () => {
    const response = await POST(new Request("http://test/api/rfid/read-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload({ clientSessionId: "API-KEY-MISSING", epcs: [activeDemoSendEpcs[0]] }))
    }));
    expect(response.status).toBe(401);
  });

  it("rejects an invalid API key", async () => {
    const response = await post(payload({ clientSessionId: "API-KEY-INVALID", epcs: [activeDemoSendEpcs[0]] }), "wrong-key");
    expect(response.status).toBe(401);
  });

  it("processes a valid handheld payload", async () => {
    const response = await post(payload({ clientSessionId: "API-HH-SEND", epcs: activeDemoSendEpcs, duplicateFirstTwo: true }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.summary).toMatchObject({ rawReadCount: 10, uniqueEpcCount: 8, acceptedCount: 8, duplicateCount: 2 });
    expect(body.transaction.transactionType).toBe("SEND_TO_LAUNDRY");
  });

  it("processes a valid fixed reader emulator payload", async () => {
    const response = await post(payload({
      clientSessionId: "API-FX-SEND",
      readerId: "FX-LDY-02",
      readerType: "FIXED_READER_EMULATOR",
      operationMode: "AUTOMATIC",
      epcs: activeDemoSendEpcs
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.session.operationMode).toBe("AUTOMATIC");
    expect(body.summary.acceptedCount).toBe(8);
  });

  it("rejects invalid payloads", async () => {
    const response = await post({ clientSessionId: "", tags: [] });
    expect(response.status).toBe(400);
  });

  it("collapses duplicate EPC reads", async () => {
    const response = await post(payload({ clientSessionId: "API-DUPES", transactionType: "STOCK_COUNT", epcs: activeDemoSendEpcs.slice(0, 2), duplicateFirstTwo: true }));
    const body = await response.json();
    expect(body.summary.rawReadCount).toBe(4);
    expect(body.summary.uniqueEpcCount).toBe(2);
    expect(body.summary.duplicateCount).toBe(2);
  });

  it("preserves unknown EPC handling", async () => {
    const response = await post(payload({ clientSessionId: "API-UNKNOWN", transactionType: "STOCK_COUNT", epcs: [activeDemoSendEpcs[0], "UNKNOWN-EPC-9999"] }));
    const body = await response.json();
    expect(body.summary.unknownCount).toBe(1);
    expect(body.items.some((item: { status: string }) => item.status === "UNKNOWN_EPC")).toBe(true);
  });

  it("rejects unsupported transaction combinations", async () => {
    const response = await post(payload({ clientSessionId: "API-ASSET", transactionType: "ASSET_AUDIT", epcs: [activeDemoSendEpcs[0]] }));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.message).toContain("ASSET_AUDIT");
  });

  it("rejects return from the wrong laundry batch as item results", async () => {
    const response = await post(payload({ clientSessionId: "API-WRONG-BATCH", transactionType: "RETURN_FROM_LAUNDRY", epcs: [activeDemoSendEpcs[0]] }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.summary.acceptedCount).toBe(0);
    expect(body.items[0].status).toBe("WRONG_BATCH");
  });

  it("returns idempotent replay for duplicate clientSessionId", async () => {
    const first = await post(payload({ clientSessionId: "API-IDEMPOTENT", epcs: activeDemoSendEpcs }));
    const second = await post(payload({ clientSessionId: "API-IDEMPOTENT", epcs: activeDemoSendEpcs }));
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(secondBody.idempotentReplay).toBe(true);
    expect(secondBody.transaction.transactionCode).toBe(firstBody.transaction.transactionCode);
    expect(await prisma.transaction.count()).toBe(1);
    expect(await prisma.rFIDReadSession.count()).toBe(1);
  });

  it("fetches a read session by clientSessionId", async () => {
    await post(payload({ clientSessionId: "API-GET-SESSION", transactionType: "STOCK_COUNT", epcs: [activeDemoSendEpcs[0]] }));
    const response = await GET(new Request("http://test/api/rfid/read-sessions/API-GET-SESSION", {
      headers: { "X-RFID-API-Key": apiKey }
    }), { params: { id: "API-GET-SESSION" } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.session.clientSessionId).toBe("API-GET-SESSION");
  });

  it("supports the existing 8 sent, 7 returned, 1 outstanding scenario", async () => {
    await post(payload({ clientSessionId: "API-SEND-8", epcs: activeDemoSendEpcs, duplicateFirstTwo: true }));
    await post(payload({ clientSessionId: "API-RETURN-7", transactionType: "RETURN_FROM_LAUNDRY", epcs: activeDemoReturnEpcs, duplicateFirstTwo: true }));

    const reconciliation = await calculateBatchReconciliation(prisma, demoBatchCode);
    expect(reconciliation).toMatchObject({ sentCount: 8, returnedCount: 7, outstandingCount: 1 });
    expect(reconciliation.outstandingItems[0]).toMatchObject({ linenCode: "LN-DUV-008", epc: "EPC30080008" });
  });
});

function post(body: unknown, key = apiKey) {
  return POST(new Request("http://test/api/rfid/read-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RFID-API-Key": key
    },
    body: JSON.stringify(body)
  }));
}

function payload(options: {
  clientSessionId: string;
  readerId?: string;
  readerType?: string;
  operationMode?: string;
  transactionType?: string;
  epcs: string[];
  duplicateFirstTwo?: boolean;
}) {
  const now = "2026-06-27T10:15:00+08:00";
  return {
    clientSessionId: options.clientSessionId,
    readerId: options.readerId ?? "C5-DEMO-01",
    readerType: options.readerType ?? "HANDHELD",
    operationMode: options.operationMode ?? "MANUAL",
    dataSource: "LIVE_DEVICE",
    checkpoint: "LINEN_STORAGE",
    transactionType: options.transactionType ?? "SEND_TO_LAUNDRY",
    laundryBatchCode: (options.transactionType ?? "SEND_TO_LAUNDRY").includes("LAUNDRY") ? demoBatchCode : undefined,
    operatorName: "Test Operator",
    startedAt: now,
    completedAt: now,
    tags: options.epcs.map((epc, index) => ({
      epc,
      rssi: -48 - index,
      antenna: null,
      readCount: options.duplicateFirstTwo && index < 2 ? 2 : 1,
      firstSeenAt: now,
      lastSeenAt: now
    }))
  };
}
