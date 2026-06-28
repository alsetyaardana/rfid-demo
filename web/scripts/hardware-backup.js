const {
  backupHardwareDatabase,
  verifyBackupDatabase
} = require("./hardware-db-utils");

async function main() {
  const { backupDir, copiedFiles } = backupHardwareDatabase();
  const snapshot = await verifyBackupDatabase(backupDir);

  console.log(`Hardware backup created: ${backupDir}`);
  for (const filePath of copiedFiles) {
    console.log(`- ${filePath}`);
  }
  console.log(`Backup verification read succeeded. Location count: ${snapshot.counts.Location}`);
}

main().catch((error) => {
  console.error(`hardware:backup failed: ${error.message}`);
  process.exit(1);
});
