import { OperationMode, ReaderType, TransactionType } from "@/lib/domain/enums";
import { activeDemoReturnEpcs, activeDemoSendEpcs, demoBatchCode } from "@/lib/domain/demo-data";
import { getDb } from "@/lib/db";
const prisma = getDb("SIMULATION");
import { buildDemoReads, calculateBatchReconciliation, processRfidReadSession } from "@/lib/services/rfid-processing";
import { resetDemoData } from "@/lib/services/reset-demo";

async function main() {
  await resetDemoData(prisma);
  const send = await processRfidReadSession(prisma, {
    clientSessionId: "CLI-SEND-DEMO",
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
  const returned = await processRfidReadSession(prisma, {
    clientSessionId: "CLI-RETURN-DEMO",
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
  const reconciliation = await calculateBatchReconciliation(prisma, demoBatchCode);
  console.log(JSON.stringify({ send, returned, reconciliation }, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
