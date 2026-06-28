const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const WEB_ROOT = path.resolve(__dirname, "..");
const PRISMA_DIR = path.join(WEB_ROOT, "prisma");
const HARDWARE_DB_BASENAME = "hardware.db";
const HARDWARE_DB_URL = `file:./${HARDWARE_DB_BASENAME}`;
const HARDWARE_DB_PATH = path.join(PRISMA_DIR, HARDWARE_DB_BASENAME);
const HARDWARE_WAL_PATH = `${HARDWARE_DB_PATH}-wal`;
const HARDWARE_SHM_PATH = `${HARDWARE_DB_PATH}-shm`;
const SIMULATION_DB_PATH = path.join(PRISMA_DIR, "simulation.db");
const BACKUP_ROOT = path.join(PRISMA_DIR, "backups", "hardware");
const SCHEMA_PATH = path.join(PRISMA_DIR, "schema.prisma");
const SCHEMA_FILENAME = path.basename(SCHEMA_PATH);

const CANONICAL_LOCATIONS = [
  { code: "LINEN-RM", name: "Main Linen Room", locationType: "STORAGE" },
  { code: "EXT-LDY", name: "Central Laundry", locationType: "LAUNDRY" }
];

const REQUIRED_TABLES = [
  "Location",
  "Linen",
  "LaundryBatch",
  "Transaction",
  "TransactionItem",
  "RFIDReadSession",
  "RFIDRead",
  "Asset"
];

function createHardwarePrismaClient(datasourceUrl = HARDWARE_DB_URL) {
  return new PrismaClient({
    datasourceUrl,
    log: ["error"]
  });
}

function formatTimestamp(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ];
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ];
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${parts.join("")}-${time.join("")}-${milliseconds}`;
}

function assertHardwareTarget() {
  if (path.basename(HARDWARE_DB_PATH) !== HARDWARE_DB_BASENAME) {
    throw new Error(`Unsafe hardware database target: ${HARDWARE_DB_PATH}`);
  }
  if (!HARDWARE_DB_PATH.startsWith(PRISMA_DIR)) {
    throw new Error(`Hardware database path escaped prisma directory: ${HARDWARE_DB_PATH}`);
  }
}

function getCanonicalLocationOrderMap() {
  return new Map(CANONICAL_LOCATIONS.map((location, index) => [location.code, index]));
}

function ensureDirectoryAbsent(targetDir) {
  if (fs.existsSync(targetDir)) {
    throw new Error(`Backup path already exists: ${targetDir}`);
  }
}

function getHardwareSidecarPaths() {
  return [HARDWARE_DB_PATH, HARDWARE_WAL_PATH, HARDWARE_SHM_PATH];
}

function resolveSchemaEngineBinary() {
  return require.resolve("@prisma/engines/schema-engine-windows.exe", { paths: [WEB_ROOT] });
}

function resolvePrismaCliEntry() {
  return require.resolve("prisma/build/index.js", { paths: [WEB_ROOT] });
}

function createEmptyHardwareDatabaseForMigration() {
  if (fs.existsSync(HARDWARE_DB_PATH)) {
    return;
  }

  const schemaEngineBinary = resolveSchemaEngineBinary();
  console.log(`Creating empty Hardware database at ${HARDWARE_DB_URL} before migration...`);
  execFileSync(
    schemaEngineBinary,
    ["cli", "--datasource", HARDWARE_DB_URL, "create-database"],
    {
      cwd: PRISMA_DIR,
      stdio: "inherit"
    }
  );
}

function runPrismaMigrateDeployForHardware() {
  assertHardwareTarget();
  createEmptyHardwareDatabaseForMigration();

  console.log(`Applying Prisma migrations to ${HARDWARE_DB_URL}...`);
  if (process.platform === "win32") {
    execFileSync(
      process.env.ComSpec || "cmd.exe",
      ["/d", "/s", "/c", `npx.cmd prisma migrate deploy --schema ${SCHEMA_FILENAME}`],
      {
        cwd: PRISMA_DIR,
        env: { ...process.env, DATABASE_URL: HARDWARE_DB_URL },
        stdio: "inherit"
      }
    );
    return;
  }

  const prismaCliEntry = resolvePrismaCliEntry();
  execFileSync(
    process.execPath,
    [prismaCliEntry, "migrate", "deploy", "--schema", SCHEMA_FILENAME],
    {
      cwd: PRISMA_DIR,
      env: { ...process.env, DATABASE_URL: HARDWARE_DB_URL },
      stdio: "inherit"
    }
  );
}

async function tableExists(prisma, tableName) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    tableName
  );
  return rows.length > 0;
}

async function ensureHardwareSchema(prisma) {
  const hasMigrationsTable = await tableExists(prisma, "_prisma_migrations");
  if (!hasMigrationsTable) {
    await prisma.$disconnect();
    runPrismaMigrateDeployForHardware();
    return createHardwarePrismaClient();
  }
  return prisma;
}

async function upsertCanonicalLocations(prisma) {
  for (const location of CANONICAL_LOCATIONS) {
    await prisma.location.upsert({
      where: { code: location.code },
      update: {
        name: location.name,
        locationType: location.locationType
      },
      create: location
    });
  }
}

async function readHardwareSnapshot(prisma) {
  const tableNames = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table'"
  );
  const existingTables = new Set(tableNames.map((row) => row.name));

  const locationOrder = getCanonicalLocationOrderMap();
  const locations = await prisma.location
    .findMany({
      select: { code: true, name: true, locationType: true }
    })
    .then((rows) =>
      rows.sort((left, right) => {
        const leftOrder = locationOrder.get(left.code);
        const rightOrder = locationOrder.get(right.code);
        if (leftOrder !== undefined && rightOrder !== undefined) {
          return leftOrder - rightOrder;
        }
        if (leftOrder !== undefined) {
          return -1;
        }
        if (rightOrder !== undefined) {
          return 1;
        }
        return left.code.localeCompare(right.code);
      })
    );

  const counts = {
    Location: await prisma.location.count(),
    Linen: await prisma.linen.count(),
    LaundryBatch: await prisma.laundryBatch.count(),
    Transaction: await prisma.transaction.count(),
    TransactionItem: await prisma.transactionItem.count(),
    RFIDReadSession: await prisma.rFIDReadSession.count(),
    RFIDRead: await prisma.rFIDRead.count(),
    Asset: await prisma.asset.count()
  };

  return {
    databasePath: HARDWARE_DB_PATH,
    hasMigrationsTable: existingTables.has("_prisma_migrations"),
    applicationTablesPresent: REQUIRED_TABLES.every((tableName) => existingTables.has(tableName)),
    existingTables,
    locations,
    counts
  };
}

function evaluateCleanBaseline(snapshot) {
  const expectedCounts = {
    Location: 2,
    Linen: 0,
    LaundryBatch: 0,
    Transaction: 0,
    TransactionItem: 0,
    RFIDReadSession: 0,
    RFIDRead: 0,
    Asset: 0
  };

  const exactLocations =
    snapshot.locations.length === CANONICAL_LOCATIONS.length &&
    CANONICAL_LOCATIONS.every((location, index) => {
      const actual = snapshot.locations[index];
      return (
        actual &&
        actual.code === location.code &&
        actual.name === location.name &&
        actual.locationType === location.locationType
      );
    });

  const countsMatch = Object.entries(expectedCounts).every(
    ([key, value]) => snapshot.counts[key] === value
  );

  return {
    pass: snapshot.hasMigrationsTable && snapshot.applicationTablesPresent && exactLocations && countsMatch,
    expectedCounts,
    exactLocations,
    countsMatch
  };
}

function printVerificationReport(snapshot, evaluation) {
  console.log(`Hardware database path: ${snapshot.databasePath}`);
  console.log(`Migration table present: ${snapshot.hasMigrationsTable ? "YES" : "NO"}`);
  console.log(`Application tables present: ${snapshot.applicationTablesPresent ? "YES" : "NO"}`);
  console.log("Location rows:");
  for (const location of snapshot.locations) {
    console.log(`- ${location.code} | ${location.name} | ${location.locationType}`);
  }
  if (snapshot.locations.length === 0) {
    console.log("- <none>");
  }
  console.log("Counts:");
  for (const [tableName, count] of Object.entries(snapshot.counts)) {
    console.log(`- ${tableName}: ${count}`);
  }
  console.log(`Baseline result: ${evaluation.pass ? "PASS" : "FAIL"}`);
}

function ensureHardwareDbExists() {
  if (!fs.existsSync(HARDWARE_DB_PATH)) {
    throw new Error(`Hardware database not found at ${HARDWARE_DB_PATH}`);
  }
}

function createBackupDirectory() {
  fs.mkdirSync(BACKUP_ROOT, { recursive: true });
  const backupDir = path.join(BACKUP_ROOT, formatTimestamp());
  ensureDirectoryAbsent(backupDir);
  fs.mkdirSync(backupDir);
  return backupDir;
}

function backupHardwareDatabase() {
  assertHardwareTarget();
  ensureHardwareDbExists();

  const backupDir = createBackupDirectory();
  const copiedFiles = [];

  for (const sourcePath of getHardwareSidecarPaths()) {
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    const destinationPath = path.join(backupDir, path.basename(sourcePath));
    fs.copyFileSync(sourcePath, destinationPath, fs.constants.COPYFILE_EXCL);
    copiedFiles.push(destinationPath);
  }

  if (copiedFiles.length === 0) {
    throw new Error("Backup failed: no hardware database files were copied.");
  }

  return { backupDir, copiedFiles };
}

async function verifyBackupDatabase(backupDir) {
  const backupDbPath = path.join(backupDir, HARDWARE_DB_BASENAME);
  if (!fs.existsSync(backupDbPath)) {
    throw new Error(`Backup database file missing: ${backupDbPath}`);
  }

  const relativeBackupUrl = `file:${path.relative(PRISMA_DIR, backupDbPath).replace(/\\/g, "/")}`;
  const prisma = createHardwarePrismaClient(relativeBackupUrl);
  try {
    const snapshot = await readHardwareSnapshot(prisma);
    return snapshot;
  } finally {
    await prisma.$disconnect();
  }
}

function removeHardwareDatabaseFiles() {
  for (const targetPath of getHardwareSidecarPaths()) {
    if (fs.existsSync(targetPath)) {
      fs.chmodSync(targetPath, 0o666);
      fs.rmSync(targetPath, { force: true, maxRetries: 5, retryDelay: 200 });
    }
  }
}

function readFileStatSafe(filePath) {
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    modifiedAt: stat.mtime.toISOString()
  };
}

module.exports = {
  BACKUP_ROOT,
  CANONICAL_LOCATIONS,
  HARDWARE_DB_PATH,
  HARDWARE_DB_URL,
  PRISMA_DIR,
  REQUIRED_TABLES,
  SCHEMA_PATH,
  SIMULATION_DB_PATH,
  assertHardwareTarget,
  backupHardwareDatabase,
  createHardwarePrismaClient,
  ensureHardwareSchema,
  evaluateCleanBaseline,
  ensureHardwareDbExists,
  printVerificationReport,
  readFileStatSafe,
  readHardwareSnapshot,
  removeHardwareDatabaseFiles,
  runPrismaMigrateDeployForHardware,
  upsertCanonicalLocations,
  verifyBackupDatabase
};
