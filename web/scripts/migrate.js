const { execSync } = require('child_process');

console.log("Migrating simulation.db...");
execSync('npx prisma migrate deploy', {
  env: { ...process.env, DATABASE_URL: 'file:./simulation.db' },
  stdio: 'inherit'
});

console.log("Migrating hardware.db...");
execSync('npx prisma migrate deploy', {
  env: { ...process.env, DATABASE_URL: 'file:./hardware.db' },
  stdio: 'inherit'
});
