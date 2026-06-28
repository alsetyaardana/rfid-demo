import { LaundryBatchStatus } from "@/lib/domain/enums";
import { assetSeeds, demoBatchCode, initialDemoBatch, linenSeeds, locationSeeds } from "@/lib/domain/demo-data";
import type { PrismaClient } from "@prisma/client";

export async function resetDemoData(prisma: PrismaClient) {
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.rFIDRead.deleteMany();
  await prisma.rFIDReadSession.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.linen.deleteMany();
  await prisma.laundryBatch.deleteMany();
  await prisma.location.deleteMany();

  for (const location of locationSeeds) {
    await prisma.location.create({ data: location });
  }

  const locations = await prisma.location.findMany();
  const locationByCode = new Map(locations.map((location) => [location.code, location]));

  for (const [linenCode, epc, linenType, currentStatus, locationCode, laundryCycleCount] of linenSeeds) {
    const location = locationByCode.get(locationCode);
    if (!location) throw new Error(`Missing location seed ${locationCode}`);
    await prisma.linen.create({
      data: {
        linenCode,
        epc,
        linenType,
        currentStatus,
        currentLocationId: location.id,
        laundryCycleCount
      }
    });
  }

  for (const [assetCode, epc, assetName, category, currentStatus, locationCode] of assetSeeds) {
    const location = locationByCode.get(locationCode);
    if (!location) throw new Error(`Missing location seed ${locationCode}`);
    await prisma.asset.create({
      data: {
        assetCode,
        epc,
        assetName,
        category,
        currentStatus,
        currentLocationId: location.id
      }
    });
  }

  const source = locationByCode.get(initialDemoBatch.sourceCode);
  const destination = locationByCode.get(initialDemoBatch.destinationCode);
  if (!source || !destination) throw new Error("Missing demo batch locations");

  await prisma.laundryBatch.create({
    data: {
      batchCode: demoBatchCode,
      sourceLocationId: source.id,
      destinationLocationId: destination.id,
      status: LaundryBatchStatus.CREATED
    }
  });
}
