const fs = require("fs");
const {
  backupHardwareDatabase,
  createHardwarePrismaClient,
  ensureHardwareSchema,
  evaluateCleanBaseline,
  HARDWARE_DB_PATH,
  printVerificationReport,
  readHardwareSnapshot,
  removeHardwareDatabaseFiles,
  runPrismaMigrateDeployForHardware,
  upsertCanonicalLocations
} = require("./hardware-db-utils");

async function main() {
  console.log("Hardware reset targets file:./hardware.db only.");
  console.log("Ensure the Next.js dev server and any SQLite clients are stopped before reset.");

  if (!fs.existsSync(HARDWARE_DB_PATH)) {
    throw new Error(`Hardware database not found at ${HARDWARE_DB_PATH}`);
  }

  const { backupDir } = backupHardwareDatabase();
  console.log(`Backup completed at ${backupDir}`);

  removeHardwareDatabaseFiles();
  runPrismaMigrateDeployForHardware();

  let prisma = createHardwarePrismaClient();
  prisma = await ensureHardwareSchema(prisma);

  try {
    await upsertCanonicalLocations(prisma);
    const snapshot = await readHardwareSnapshot(prisma);
    const evaluation = evaluateCleanBaseline(snapshot);
    printVerificationReport(snapshot, evaluation);
    if (!evaluation.pass) {
      throw new Error("Hardware reset verification failed.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`hardware:reset failed: ${error.message}`);
  process.exit(1);
});
