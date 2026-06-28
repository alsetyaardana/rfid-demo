const {
  createHardwarePrismaClient,
  ensureHardwareSchema,
  upsertCanonicalLocations
} = require("./hardware-db-utils");

async function main() {
  let prisma = createHardwarePrismaClient();
  prisma = await ensureHardwareSchema(prisma);

  try {
    await upsertCanonicalLocations(prisma);
    console.log("Hardware database initialized with canonical locations.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`hardware:init failed: ${error.message}`);
  process.exit(1);
});
