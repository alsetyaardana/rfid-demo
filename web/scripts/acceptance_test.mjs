import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:\\Users\\Admin\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("=== Start Acceptance Test ===");

  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  console.log("Navigating to http://localhost:3000 ...");
  await page.goto('http://localhost:3000');

  // Clear local storage and refresh
  console.log("Clearing localStorage and hard refreshing...");
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  // 1. Welcome Screen Validation
  console.log("Checking Welcome Screen...");
  const welcomeHtml = await page.content();
  const hasPortaNusa = welcomeHtml.includes("Welcome to Porta Nusa Hotel");
  const hasSimulation = welcomeHtml.includes("Simulation Mode");
  const hasHardware = welcomeHtml.includes("Hardware Mode");
  const hasLoginInput = welcomeHtml.includes("<input") || welcomeHtml.includes("password");

  console.log("Porta Nusa Title found:", hasPortaNusa);
  console.log("Simulation Mode found:", hasSimulation);
  console.log("Hardware Mode found:", hasHardware);
  console.log("Is Login Page?", hasLoginInput);
  
  if (hasLoginInput) {
    console.error("FAIL: Screen resembles a login page!");
  }

  // Check Guide Links
  const hasGuideLink1 = welcomeHtml.includes("/guides/simulation");
  const hasGuideLink2 = welcomeHtml.includes("/guides/hardware");
  const hasGuideLink3 = welcomeHtml.includes("/guides/system-overview");
  console.log("Guide links found:", hasGuideLink1 && hasGuideLink2 && hasGuideLink3);

  // Take screenshot
  await page.screenshot({ path: 'screenshot-welcome.png' });
  console.log("Saved screenshot-welcome.png");

  // 2. Click Simulation Mode
  console.log("Clicking Simulation Mode...");
  // Find the button for Simulation Mode (it's the first mode-card)
  const buttons = await page.$$('.mode-card');
  if (buttons.length > 0) {
    await buttons[0].click();
    await page.waitForSelector('.app-shell');
  }

  console.log("Checking Simulation Mode Sidebar...");
  let sidebarHtml = await page.$eval('.sidebar', el => el.outerHTML);
  let hasGenerateDemo = sidebarHtml.includes("Generate Demo Data");
  console.log("Generate Demo Data found:", hasGenerateDemo);
  
  await page.screenshot({ path: 'screenshot-dashboard-simulation.png' });
  console.log("Saved screenshot-dashboard-simulation.png");

  // Check for any old branding in dashboard
  let fullHtml = await page.content();
  let hasOldBranding = fullHtml.includes("Crowne Plaza") || fullHtml.includes("fictional hotel") || fullHtml.includes("Demo Hotel");
  console.log("Old branding found in Dashboard:", hasOldBranding);

  // 3. Switch to Hardware Mode
  console.log("Switching Demo Mode...");
  const switchBtn = await page.$('.switch-mode-btn');
  if (switchBtn) {
    await switchBtn.click();
    await page.waitForSelector('.welcome-screen');
  }

  console.log("Clicking Hardware Mode...");
  const buttonsAgain = await page.$$('.mode-card');
  if (buttonsAgain.length > 1) {
    await buttonsAgain[1].click();
    await page.waitForSelector('.app-shell');
  }

  sidebarHtml = await page.$eval('.sidebar', el => el.outerHTML);
  let hasApkDownload = sidebarHtml.includes("Android APK Download");
  console.log("Android APK Download found:", hasApkDownload);

  await page.screenshot({ path: 'screenshot-dashboard-hardware.png' });
  console.log("Saved screenshot-dashboard-hardware.png");

  // 4. Guide pages validation
  console.log("Checking Guide Pages...");
  await page.goto('http://localhost:3000/guides/simulation');
  let guideHtml = await page.content();
  console.log("Simulation Guide loaded:", guideHtml.includes("Simulation User Guide") && guideHtml.includes("PDF Preview Placeholder"));
  
  console.log("Console Errors recorded:", errors.length > 0 ? errors : "None");

  await browser.close();
  console.log("=== Acceptance Test Completed ===");
})();
