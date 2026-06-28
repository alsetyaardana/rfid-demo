const {
  createHardwarePrismaClient,
  ensureHardwareDbExists,
  evaluateCleanBaseline,
  printVerificationReport,
  readHardwareSnapshot
} = require("./hardware-db-utils");

async function main() {
  ensureHardwareDbExists();
  const prisma = createHardwarePrismaClient();
  try {
    const snapshot = await readHardwareSnapshot(prisma);
    const evaluation = evaluateCleanBaseline(snapshot);
    printVerificationReport(snapshot, evaluation);

    if (!evaluation.pass) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`hardware:verify failed: ${error.message}`);
  process.exit(1);
});
