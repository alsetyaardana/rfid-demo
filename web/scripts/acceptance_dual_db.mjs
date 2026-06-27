import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:\\Users\\Admin\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("=== Start Dual DB Acceptance Test ===");

  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));

  // 1. Setup Simulation Mode
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  console.log("Clicking Simulation Mode...");
  const buttons = await page.$$('.mode-card');
  await buttons[0].click();
  await page.waitForSelector('.app-shell');

  // Insert SIM-TEST-001 into simulation.db via Prisma (simulated backend action)
  console.log("Inserting SIM-TEST-001 into simulation...");
  execSync('node -e "const { PrismaClient } = require(\'@prisma/client\'); const p = new PrismaClient({datasourceUrl:\'file:./simulation.db\'}); p.location.upsert({where:{code:\'LINEN-RM\'}, update:{}, create:{code:\'LINEN-RM\', name:\'Linen Room\', locationType:\'INTERNAL\'}}).then(loc => p.linen.upsert({where:{epc:\'EPC-SIM-01\'}, update:{}, create:{epc:\'EPC-SIM-01\', linenCode:\'SIM-TEST-001\', linenType:\'BATH_TOWEL\', currentStatus:\'AVAILABLE\', currentLocationId: loc.id}})).then(()=>p.$disconnect());"', {stdio: 'inherit'});

  await page.reload({ waitUntil: 'networkidle0' });
  await page.goto('http://localhost:3000/linen-master');
  await page.waitForSelector('table');
  let html = await page.content();
  console.log("SIM-TEST-001 found in Simulation Mode?", html.includes("SIM-TEST-001"));

  // 2. Hardware Mode
  console.log("Switching to Hardware Mode...");
  await page.$eval('.switch-mode-btn', el => el.click());
  await page.waitForSelector('.welcome-screen');

  const buttonsAgain = await page.$$('.mode-card');
  await buttonsAgain[1].click();
  await page.waitForSelector('.app-shell');

  await page.goto('http://localhost:3000/linen-master');
  await page.waitForSelector('table');
  html = await page.content();
  console.log("SIM-TEST-001 NOT found in Hardware Mode?", !html.includes("SIM-TEST-001"));

  console.log("Inserting HW-TEST-001 into hardware...");
  execSync('node -e "const { PrismaClient } = require(\'@prisma/client\'); const p = new PrismaClient({datasourceUrl:\'file:./hardware.db\'}); p.location.upsert({where:{code:\'LINEN-RM\'}, update:{}, create:{code:\'LINEN-RM\', name:\'Linen Room\', locationType:\'INTERNAL\'}}).then(loc => p.linen.upsert({where:{epc:\'EPC-HW-01\'}, update:{}, create:{epc:\'EPC-HW-01\', linenCode:\'HW-TEST-001\', linenType:\'BATH_TOWEL\', currentStatus:\'AVAILABLE\', currentLocationId: loc.id}})).then(()=>p.$disconnect());"', {stdio: 'inherit'});

  await page.reload({ waitUntil: 'networkidle0' });
  html = await page.content();
  console.log("HW-TEST-001 found in Hardware Mode?", html.includes("HW-TEST-001"));

  // 3. Return to Simulation
  console.log("Switching back to Simulation Mode...");
  await page.$eval('.switch-mode-btn', el => el.click());
  await page.waitForSelector('.welcome-screen');
  const buttonsFinal = await page.$$('.mode-card');
  await buttonsFinal[0].click();
  await page.waitForSelector('.app-shell');

  await page.goto('http://localhost:3000/linen-master');
  await page.waitForSelector('table');
  html = await page.content();
  console.log("SIM-TEST-001 found in Simulation Mode?", html.includes("SIM-TEST-001"));
  console.log("HW-TEST-001 NOT found in Simulation Mode?", !html.includes("HW-TEST-001"));

  // Simulate Android API request
  console.log("Testing Android API Routing...");
  const apiOutput = execSync(`curl -s -X POST http://localhost:3000/api/rfid/read-sessions -H "Content-Type: application/json" -H "X-Demo-Mode: HARDWARE" -H "X-RFID-API-Key: local-demo-rfid-key" -d "{\\"clientSessionId\\":\\"ANDROID-HW-01\\",\\"readerId\\":\\"C5-01\\",\\"readerType\\":\\"HANDHELD\\",\\"operationMode\\":\\"MANUAL\\",\\"checkpoint\\":\\"Linen Room\\",\\"transactionType\\":\\"STOCK_COUNT\\",\\"dataSource\\":\\"LIVE_DEVICE\\",\\"operatorName\\":\\"Demo\\",\\"startedAt\\":\\"2026-06-28T00:00:00Z\\",\\"completedAt\\":\\"2026-06-28T00:00:00Z\\",\\"tags\\":[{\\"epc\\":\\"EPC-HW-01\\",\\"rssi\\":-50,\\"readCount\\":1,\\"firstSeenAt\\":\\"2026-06-28T00:00:00Z\\",\\"lastSeenAt\\":\\"2026-06-28T00:00:00Z\\"}]}"`).toString();
  console.log("API Response:", apiOutput);

  // Check hardware DB for the session
  const hwSessionFound = execSync('node -e "const { PrismaClient } = require(\'@prisma/client\'); const p = new PrismaClient({datasourceUrl:\'file:./hardware.db\'}); p.rFIDReadSession.findFirst({where:{clientSessionId:\'ANDROID-HW-01\'}}).then(res=>{console.log(\'Session found in HW DB:\', !!res); p.$disconnect()});"').toString();
  console.log(hwSessionFound.trim());

  const simSessionFound = execSync('node -e "const { PrismaClient } = require(\'@prisma/client\'); const p = new PrismaClient({datasourceUrl:\'file:./simulation.db\'}); p.rFIDReadSession.findFirst({where:{clientSessionId:\'ANDROID-HW-01\'}}).then(res=>{console.log(\'Session found in SIM DB:\', !!res); p.$disconnect()});"').toString();
  console.log(simSessionFound.trim());

  console.log("Console Errors recorded:", errors.length > 0 ? errors : "None");
  await browser.close();
  console.log("=== Acceptance Test Completed ===");
})();
