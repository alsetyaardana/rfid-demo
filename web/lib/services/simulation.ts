import type { PrismaClient } from "@prisma/client";
import { LinenStatus, LaundryBatchStatus } from "@/lib/domain/enums";
import { locationSeeds } from "@/lib/domain/demo-data";

const RECORD_LIMIT = 100;

export async function checkRecordLimits(prisma: PrismaClient, entity: 'linen' | 'laundryBatch' | 'transaction' | 'rfidReadSession', requestedQuantity = 0) {
  let count = 0;
  switch (entity) {
    case 'linen': count = await prisma.linen.count(); break;
    case 'laundryBatch': count = await prisma.laundryBatch.count(); break;
    case 'transaction': count = await prisma.transaction.count(); break;
    case 'rfidReadSession': count = await prisma.rFIDReadSession.count(); break;
  }
  
  if (count + requestedQuantity > RECORD_LIMIT) {
    throw new Error(`Limit reached: ${entity} cannot exceed ${RECORD_LIMIT} records. Currently at ${count}.`);
  }
  
  return { count, limit: RECORD_LIMIT };
}

export async function getSimulationMetrics(prisma: PrismaClient) {
  const [linen, batches, sessions, transactions] = await Promise.all([
    prisma.linen.count(),
    prisma.laundryBatch.count(),
    prisma.rFIDReadSession.count(),
    prisma.transaction.count()
  ]);
  return {
    linen,
    batches,
    sessions,
    transactions,
    limit: RECORD_LIMIT
  };
}

export async function clearSimulationData(prisma: PrismaClient) {
  // Safe deletion order for operational data, leaving Locations intact.
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.rFIDRead.deleteMany();
  await prisma.rFIDReadSession.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.linen.deleteMany();
  await prisma.laundryBatch.deleteMany();
}

export async function resetSimulationDatabase(prisma: PrismaClient) {
  // Clear everything including locations, then reseed basic infrastructure (locations)
  await clearSimulationData(prisma);
  await prisma.location.deleteMany();
  
  for (const location of locationSeeds) {
    await prisma.location.create({ data: location });
  }
}

export async function generateSimulationData(prisma: PrismaClient, quantity: number) {
  if (quantity <= 0) return;
  await checkRecordLimits(prisma, 'linen', quantity);
  
  const locations = await prisma.location.findMany();
  const linenRoom = locations.find(l => l.code === 'LINEN-RM');
  
  if (!linenRoom) {
    throw new Error("Infrastructure missing. Reset simulation database first.");
  }
  
  const realisticTypes = ["Bath Towel", "Hand Towel", "Bed Sheet", "Pillowcase", "Duvet Cover"];
  
  for (let i = 0; i < quantity; i++) {
    const id = Math.random().toString(36).substring(2, 14);
    const type = realisticTypes[Math.floor(Math.random() * realisticTypes.length)];
    
    await prisma.linen.create({
      data: {
        linenCode: `SIM-LN-${id.substring(0, 6).toUpperCase()}`,
        epc: `EPC-${id.toUpperCase()}`,
        linenType: type,
        currentStatus: LinenStatus.AVAILABLE,
        currentLocationId: linenRoom.id,
        laundryCycleCount: 0
      }
    });
  }
}
