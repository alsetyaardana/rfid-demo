import { getDb } from "@/lib/db";
const prisma = getDb("SIMULATION");
import { resetSimulationDatabase } from "@/lib/services/simulation";

async function main() {
  // We no longer automatically populate mock data on startup.
  // The database will be clean, and users can generate data via the UI.
  // But we do need to ensure the basic location infrastructure exists.
  const locationCount = await prisma.location.count();
  if (locationCount === 0) {
    await resetSimulationDatabase(prisma);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
