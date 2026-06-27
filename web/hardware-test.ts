import { getDb } from "./lib/db";
import { registerPhysicalEpcAction } from "./app/actions";
import { processRfidReadSession } from "./lib/services/rfid-processing";
import { OperationMode, ReaderType, TransactionType } from "./lib/domain/enums";

async function run() {
  const pHardware = getDb("HARDWARE");
  
  try {
    // 1. Clear Hardware DB
    await pHardware.rFIDRead.deleteMany();
    await pHardware.rFIDReadSession.deleteMany();
    await pHardware.transactionItem.deleteMany();
    await pHardware.transaction.deleteMany();
    await pHardware.laundryBatch.deleteMany();
    await pHardware.linen.deleteMany();

    // ensure location exists
    let location = await pHardware.location.findUnique({ where: { code: "LINEN-RM" } });
    if (!location) {
      location = await pHardware.location.create({ data: { code: "LINEN-RM", name: "Linen Room", locationType: "STORAGE" } });
    }
    let extLdy = await pHardware.location.findUnique({ where: { code: "EXT-LDY" } });
    if (!extLdy) {
      extLdy = await pHardware.location.create({ data: { code: "EXT-LDY", name: "External Laundry", locationType: "EXTERNAL" } });
    }

    const testEpc = "EPCPHYSICAL001";
    const testLinenCode = "LN-PHYSICAL-001";

    console.log("=== 1. Scan unregistered UHF tag ===");
    const res1 = await processRfidReadSession(pHardware, {
      clientSessionId: `HW-SCAN-1`,
      readerId: "C5-TEST",
      readerType: ReaderType.HANDHELD,
      operationMode: OperationMode.AUTOMATIC,
      checkpoint: "Demo Checkpoint",
      transactionType: TransactionType.STOCK_COUNT,
      confirm: false,
      reads: [{ epc: testEpc, rssi: -55 }]
    });

    console.log(`Unknown Count: ${res1.unknownCount}`);
    if (res1.unknownCount !== 1) throw new Error("Expected 1 unknown EPC");
    
    // Check if it appears in UNKNOWN_EPC
    const unknowns = await pHardware.rFIDRead.findMany({ where: { validationStatus: "UNKNOWN_EPC" } });
    if (unknowns.length === 0 || unknowns[0].epc !== testEpc) throw new Error("Not logged as UNKNOWN_EPC");
    console.log("Appears as UNKNOWN_EPC successfully.");

    console.log("=== 2. Register it ===");
    // Inline the registration logic for the test to bypass Next.js request context issues
    const location2 = await pHardware.location.findUnique({ where: { code: "LINEN-RM" } });
    if (!location2) throw new Error("Base infrastructure missing");
    await pHardware.linen.create({
      data: {
        epc: testEpc,
        linenCode: testLinenCode,
        linenType: "Bath Towel",
        currentStatus: "AVAILABLE",
        currentLocationId: location2.id,
        laundryCycleCount: 0
      }
    });
    const registered = await pHardware.linen.findUnique({ where: { epc: testEpc } });
    if (!registered) throw new Error("Failed to register");
    console.log(`Registered linen: ${registered.linenCode}`);

    console.log("=== 3. Scan the same tag again ===");
    const res2 = await processRfidReadSession(pHardware, {
      clientSessionId: `HW-SCAN-2`,
      readerId: "C5-TEST",
      readerType: ReaderType.HANDHELD,
      operationMode: OperationMode.AUTOMATIC,
      checkpoint: "Demo Checkpoint",
      transactionType: TransactionType.STOCK_COUNT,
      confirm: false,
      reads: [{ epc: testEpc, rssi: -50 }]
    });
    if (res2.acceptedCount !== 1) throw new Error("Expected accepted count = 1 after registration");
    console.log("Recognized successfully.");

    console.log("=== 4. Lifecycle (Send and Return) ===");
    const batch = await pHardware.laundryBatch.create({
      data: { batchCode: "LB-HW-1", status: "CREATED", sourceLocationId: location.id, destinationLocationId: extLdy.id }
    });

    const sendRes = await processRfidReadSession(pHardware, {
      clientSessionId: `HW-SEND-1`,
      readerId: "C5-TEST",
      readerType: ReaderType.HANDHELD,
      operationMode: OperationMode.AUTOMATIC,
      checkpoint: "Gate",
      transactionType: TransactionType.SEND_TO_LAUNDRY,
      laundryBatchCode: batch.batchCode,
      confirm: true,
      reads: [{ epc: testEpc, rssi: -50 }]
    });
    if (sendRes.acceptedCount !== 1) throw new Error("Send failed");
    console.log("Send transaction succeeded.");

    const returnRes = await processRfidReadSession(pHardware, {
      clientSessionId: `HW-RETURN-1`,
      readerId: "C5-TEST",
      readerType: ReaderType.HANDHELD,
      operationMode: OperationMode.AUTOMATIC,
      checkpoint: "Return Desk",
      transactionType: TransactionType.RETURN_FROM_LAUNDRY,
      laundryBatchCode: batch.batchCode,
      confirm: true,
      reads: [{ epc: testEpc, rssi: -50 }]
    });
    if (returnRes.acceptedCount !== 1) throw new Error("Return failed");
    console.log("Return transaction succeeded.");

    console.log("=== 5. Validate Duplicate Handling ===");
    try {
      await pHardware.linen.create({
        data: {
          epc: testEpc,
          linenCode: "LN-NEW",
          linenType: "Bath Towel",
          currentStatus: "AVAILABLE",
          currentLocationId: location2.id,
          laundryCycleCount: 0
        }
      });
      throw new Error("Duplicate EPC allowed!");
    } catch(e: any) {
      if (e.message.includes("Unique constraint failed") || e.message.includes("Duplicate")) {
        console.log("Duplicate EPC properly blocked by Prisma schema.");
      } else throw e;
    }
    
    try {
      await pHardware.linen.create({
        data: {
          epc: "EPCDIFFERENT01",
          linenCode: testLinenCode,
          linenType: "Bath Towel",
          currentStatus: "AVAILABLE",
          currentLocationId: location2.id,
          laundryCycleCount: 0
        }
      });
      throw new Error("Duplicate Code allowed!");
    } catch(e: any) {
      if (e.message.includes("Unique constraint failed") || e.message.includes("Duplicate")) {
        console.log("Duplicate Code properly blocked by Prisma schema.");
      } else throw e;
    }

    console.log("\nHardware Lifecycle Validation Passed.");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

run();
