"use strict";

const icon = {
  dashboard: '<svg viewBox="0 0 24 24"><path d="M4 13h7V4H4v9Z"/><path d="M13 20h7V4h-7v16Z"/><path d="M4 20h7v-5H4v5Z"/></svg>',
  scan: '<svg viewBox="0 0 24 24"><path d="M4 7V4h3"/><path d="M17 4h3v3"/><path d="M20 17v3h-3"/><path d="M7 20H4v-3"/><path d="M7 12h10"/><path d="M12 7v10"/></svg>',
  linen: '<svg viewBox="0 0 24 24"><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/><path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  batch: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M6 7v12h12V7"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>',
  reconcile: '<svg viewBox="0 0 24 24"><path d="m4 12 4 4 4-4"/><path d="M8 16V5"/><path d="m20 12-4-4-4 4"/><path d="M16 8v11"/></svg>',
  device: '<svg viewBox="0 0 24 24"><path d="M7 4h10v16H7z"/><path d="M10 18h4"/><path d="M10 7h4"/><path d="M12 11v3"/></svg>',
  history: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 5v5h5"/><path d="M12 8v5l3 2"/></svg>',
  asset: '<svg viewBox="0 0 24 24"><path d="M4 8 12 4l8 4-8 4-8-4Z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7-11-7Z"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>'
};

const navItems = [
  ["dashboard", "Dashboard", "Live linen demo", icon.dashboard],
  ["rfid-scan", "RFID Scan", "Handheld and fixed reader simulation", icon.scan],
  ["linen-master", "Linen Master", "Registered linen inventory", icon.linen],
  ["laundry-batches", "Laundry Batches", "Dispatch and return batches", icon.batch],
  ["reconciliation", "Reconciliation", "Outstanding linen detection", icon.reconcile],
  ["device-activity", "Device Activity", "Reader sessions and uploads", icon.device],
  ["transaction-history", "Transaction History", "Confirmed RFID transactions", icon.history],
  ["asset-management", "Asset Management", "Potential expansion use case", icon.asset]
];

const demoBatch = {
  id: "LB-DEMO-001",
  sent: 8,
  returned: 7,
  outstanding: 1,
  facility: "Central Laundry",
  exactItem: "LN-TWL-008",
  lastLocation: "Laundry Dispatch Gate",
  lastScanTime: "10:42:18",
  lastReader: "FX-LDY-02"
};

const linens = [
  ["LN-TWL-001", "Bath Towel", "EPC-3008-0001", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-TWL-002", "Bath Towel", "EPC-3008-0002", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-TWL-003", "Bath Towel", "EPC-3008-0003", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-TWL-004", "Bath Towel", "EPC-3008-0004", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-SHT-005", "King Sheet", "EPC-3008-0005", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-SHT-006", "King Sheet", "EPC-3008-0006", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-PCW-007", "Pillow Case", "EPC-3008-0007", "Returned Clean", "Central Laundry", "Cycle 24"],
  ["LN-TWL-008", "Bath Towel", "EPC-3008-0008", "Outstanding", "Laundry Dispatch Gate", "Cycle 24"]
];

const baseReads = [
  ["EPC-3008-0001", "LN-TWL-001", "Bath Towel", "HH-MGR-04", "Handheld", "Handheld Operation", "-48 dBm", "10:44:10", "Valid"],
  ["EPC-3008-0002", "LN-TWL-002", "Bath Towel", "HH-MGR-04", "Handheld", "Handheld Operation", "-51 dBm", "10:44:13", "Valid"],
  ["EPC-3008-0003", "LN-TWL-003", "Bath Towel", "FX-LDY-02", "Fixed Reader Emulator", "Website Simulation", "-57 dBm", "10:44:16", "Valid"],
  ["EPC-3008-0008", "LN-TWL-008", "Bath Towel", "FX-LDY-02", "Fixed Reader Emulator", "Website Simulation", "-72 dBm", "10:42:18", "Outstanding"]
];

const state = {
  screen: "dashboard",
  mode: "Handheld Operation",
  scanning: false,
  monitoring: false,
  countdown: 30,
  reads: [...baseReads],
  transactions: [
    ["TXN-10031", "Laundry Return", demoBatch.id, "7 returned, 1 outstanding", "HH-MGR-04", "10:45:02", "Confirmed"],
    ["TXN-10030", "Laundry Dispatch", demoBatch.id, "8 sent", "FX-LDY-01", "08:10:44", "Uploaded"],
    ["TXN-10029", "Stock Count", "Lobby Linen Room", "42 tags", "SIM-WEB-01", "07:52:11", "Confirmed"]
  ],
  deviceSessions: [
    ["10:45:02", "HH-MGR-04", "Handheld", "Handheld Operation", "Laundry Return Desk", "SES-HH-8812", 7, "Uploaded", "TXN-10031"],
    ["10:44:16", "FX-LDY-02", "Fixed Reader Emulator", "Website Simulation", "Laundry Dispatch Gate", "SES-FX-3308", 8, "Auto Upload Active", "Pending"],
    ["08:10:44", "FX-LDY-01", "Fixed Reader", "Continuous Monitoring", "Laundry Receiving", "SES-FX-3307", 8, "Uploaded", "TXN-10030"],
    ["07:52:11", "SIM-WEB-01", "Simulator", "Website Simulation", "Linen Room", "SES-SIM-2041", 42, "Uploaded", "TXN-10029"]
  ]
};

let monitorTimer = null;
let scanTimer = null;

function badge(value) {
  const lower = String(value).toLowerCase();
  const tone = lower.includes("outstanding") || lower.includes("failed") ? "red" :
    lower.includes("pending") || lower.includes("active") || lower.includes("dirty") ? "gold" :
    lower.includes("handheld") || lower.includes("fixed") || lower.includes("simulator") ? "navy" : "teal";
  return `<span class="badge ${tone}">${value}</span>`;
}

function table(headers, rows, badgeColumns = []) {
  const body = rows.map((row) => `<tr>${row.map((cell, index) => {
    const value = badgeColumns.includes(index) ? badge(cell) : cell;
    const mono = /^(EPC|LN-|TXN-|SES-|HH-|FX-|SIM-|LB-)/.test(String(cell)) ? " mono" : "";
    return `<td class="${mono.trim()}">${value}</td>`;
  }).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function metric(label, value, note, tone = "") {
  return `<article class="card metric ${tone}"><label>${label}</label><strong>${value}</strong><small>${note}</small></article>`;
}

function actionButton(kind, label, svg, id, disabled = false) {
  return `<button class="btn ${kind}" id="${id}" ${disabled ? "disabled" : ""}><span class="button-icon">${svg}</span>${label}</button>`;
}

function renderNav() {
  const nav = document.getElementById("navList");
  nav.innerHTML = navItems.map(([id, label, , svg]) => `
    <button class="nav-button ${state.screen === id ? "active" : ""}" data-screen="${id}">
      <span class="nav-icon">${svg}</span>
      <span>${label}</span>
    </button>
  `).join("");
  nav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => setScreen(button.dataset.screen));
  });
}

function setScreen(screen) {
  state.screen = screen;
  const item = navItems.find(([id]) => id === screen);
  document.getElementById("pageTitle").textContent = item[1];
  document.getElementById("pageEyebrow").textContent = item[2];
  renderNav();
  renderScreen();
}

function renderScreen() {
  const root = document.getElementById("screenRoot");
  const renderers = {
    "dashboard": renderDashboard,
    "rfid-scan": renderRfidScan,
    "linen-master": renderLinenMaster,
    "laundry-batches": renderLaundryBatches,
    "reconciliation": renderReconciliation,
    "device-activity": renderDeviceActivity,
    "transaction-history": renderTransactionHistory,
    "asset-management": renderAssetManagement
  };
  root.innerHTML = renderers[state.screen]();
  bindScreenEvents();
}

function renderDashboard() {
  return `
    <div class="screen">
      <div class="section-head">
        <div>
          <h2>Operations Dashboard</h2>
          <p>Real-time view of the active hotel linen RFID demo, using one consistent batch scenario across scan, return, and reconciliation.</p>
        </div>
        ${actionButton("primary", "Open Reconciliation", icon.reconcile, "openReconciliation")}
      </div>
      <section class="demo-band">
        <div>
          <h3>Tracking Laundry Batch <span class="mono">${demoBatch.id}</span></h3>
          <p>Workflow: RFID Scan to Laundry Transaction to Return to Reconciliation to Outstanding Linen.</p>
        </div>
        ${badge(`${demoBatch.outstanding} Outstanding`)}
      </section>
      <section class="grid-4">
        ${metric("Hotel-wide linens", "1,248", "Large operational total for dashboard context", "teal")}
        ${metric("In Laundry", "186", "Across active laundry operations", "gold")}
        ${metric("Active demo batch", demoBatch.sent, "Sent to laundry in LB-DEMO-001", "teal")}
        ${metric("Outstanding", demoBatch.outstanding, "Single item requires investigation", "red")}
      </section>
      <section class="grid-3">
        <article class="card span-2">
          <div class="card-title"><h3>Active Batch Flow</h3>${badge("Demo batch")}</div>
          <div class="reader-panel">
            <div>
              <strong class="mono">${demoBatch.id}</strong>
              <p>8 sent from housekeeping, 7 returned clean, 1 outstanding after dispatch-gate validation.</p>
              <div class="button-row">
                ${badge("8 Sent")}
                ${badge("7 Returned Clean")}
                ${badge("1 Outstanding")}
              </div>
            </div>
            <div class="reader-visual" aria-hidden="true"></div>
          </div>
        </article>
        <article class="card">
          <div class="card-title"><h3>Operational Insight</h3>${badge("Exception")}</div>
          <p>The missing bath towel was last read at the Laundry Dispatch Gate by <span class="mono">${demoBatch.lastReader}</span>. Check outbound staging before marking the item as lost.</p>
        </article>
      </section>
      <section class="card tight">
        ${table(["EPC", "Linen ID", "Type", "Reader", "Mode", "Time", "Status"], state.reads.map((r) => [r[0], r[1], r[2], r[3], r[5], r[7], r[8]]), [6])}
      </section>
    </div>
  `;
}

function renderRfidScan() {
  const isHandheld = state.mode === "Handheld Operation";
  const isFixed = state.mode === "Fixed Reader Emulator";
  return `
    <div class="screen">
      <div class="section-head">
        <div>
          <h2>RFID Scan</h2>
          <p>Website-only simulation of handheld scanning and fixed reader monitoring. No real hardware or API integration is included in this phase.</p>
        </div>
        <div class="segmented" role="tablist" aria-label="Operation mode">
          ${["Handheld Operation", "Fixed Reader Emulator", "Live Device", "Website Simulation"].map((mode) => `<button class="${state.mode === mode ? "active" : ""}" data-mode="${mode}">${mode}</button>`).join("")}
        </div>
      </div>
      <section class="grid-3">
        <article class="card span-2">
          <div class="card-title"><h3>${state.mode}</h3>${state.scanning || state.monitoring ? badge("Active") : badge("Ready")}</div>
          ${isFixed ? fixedReaderForm() : handheldForm(isHandheld)}
        </article>
        <article class="card">
          <div class="card-title"><h3>Read Window</h3>${badge(isFixed ? "Auto Upload Active" : "Manual Review")}</div>
          ${isFixed ? `<div class="countdown">${state.countdown}s</div><p>Continuous monitoring uploads reads automatically when the active window closes.</p>` : `<div class="reader-visual"></div><p>Start scanning to append simulated RFID reads for review before confirmation.</p>`}
        </article>
      </section>
      <section class="card tight">
        ${table(["EPC", "Linen ID", "Linen Type", "Reader ID", "Reader Type", "Operation Mode", "RSSI", "Timestamp", "Validation Status"], state.reads, [4, 5, 8])}
      </section>
    </div>
  `;
}

function handheldForm(isHandheld) {
  return `
    <div class="form-grid">
      <div class="field"><label>Activity</label><select><option>Laundry Return</option><option>Stock Count</option><option>Laundry Dispatch</option></select></div>
      <div class="field"><label>Location</label><select><option>Laundry Return Desk</option><option>Linen Room</option><option>Housekeeping Floor 7</option></select></div>
      <div class="field"><label>Batch</label><select><option>${demoBatch.id}</option><option>Not required</option></select></div>
      <div class="field"><label>Reader ID</label><input class="mono" value="${isHandheld ? "HH-MGR-04" : "SIM-WEB-01"}"></div>
    </div>
    <div class="button-row" style="margin-top:16px">
      ${actionButton("primary", "Start Scan", icon.play, "startScan", state.scanning)}
      ${actionButton("secondary", "Stop Scan", icon.stop, "stopScan", !state.scanning)}
      ${actionButton("primary", "Confirm Transaction", icon.check, "confirmTransaction")}
    </div>
  `;
}

function fixedReaderForm() {
  return `
    <div class="form-grid">
      <div class="field"><label>Reader ID</label><input class="mono" value="FX-LDY-02"></div>
      <div class="field"><label>Checkpoint</label><select><option>Laundry Dispatch Gate</option><option>Laundry Receiving</option><option>Service Corridor</option></select></div>
      <div class="field"><label>Automatic Rule</label><select><option>Auto-create return transaction</option><option>Flag unexpected linen</option></select></div>
      <div class="field"><label>Read Window</label><select><option>30 seconds</option><option>60 seconds</option><option>Continuous</option></select></div>
    </div>
    <div class="button-row" style="margin-top:16px">
      ${actionButton("primary", "Start Monitoring", icon.play, "startMonitoring", state.monitoring)}
      ${actionButton("secondary", "Stop Monitoring", icon.stop, "stopMonitoring", !state.monitoring)}
      ${actionButton("secondary", "Automatic Upload", icon.upload, "autoUpload")}
    </div>
  `;
}

function renderLinenMaster() {
  return `
    <div class="screen">
      <div class="section-head">
        <div><h2>Linen Master</h2><p>Registered linen inventory with RFID identifiers, status, location, and laundry-cycle context.</p></div>
        ${actionButton("primary", "Register Linen", icon.linen, "noop")}
      </div>
      <section class="grid-4">
        ${metric("Available", "842", "Ready for hotel operations", "teal")}
        ${metric("In Use", "219", "Assigned to rooms and outlets")}
        ${metric("In Laundry", "186", "Across active batches", "gold")}
        ${metric("Outstanding", "1", "Current demo exception", "red")}
      </section>
      <section class="card tight">
        ${table(["Linen ID", "Linen Type", "EPC", "Status", "Last Location", "Laundry Cycle"], linens, [3])}
      </section>
    </div>
  `;
}

function renderLaundryBatches() {
  const rows = [
    [demoBatch.id, "Central Laundry", "Bath Towels / Sheets", demoBatch.sent, demoBatch.returned, demoBatch.outstanding, "Reconciliation Required"],
    ["LB-2026-002", "Central Laundry", "King Sheets", 24, 24, 0, "Returned Clean"],
    ["LB-2026-003", "Express Laundry", "Pillow Cases", 32, 0, 0, "In Laundry"],
    ["LB-2026-004", "Central Laundry", "Pool Towels", 18, 18, 0, "Closed"]
  ];
  return `
    <div class="screen">
      <div class="section-head">
        <div><h2>Laundry Batches</h2><p>Batch-level dispatch and return tracking. The active demonstration batch keeps the required 8 / 7 / 1 scenario.</p></div>
        ${actionButton("primary", "Create Batch", icon.batch, "noop")}
      </div>
      <section class="grid-3">
        ${metric("Sent", demoBatch.sent, `${demoBatch.id} dispatched`, "teal")}
        ${metric("Returned", demoBatch.returned, "Clean linen scanned back", "teal")}
        ${metric("Outstanding", demoBatch.outstanding, "Requires reconciliation", "red")}
      </section>
      <section class="card tight">
        ${table(["Batch ID", "Facility", "Contents", "Sent", "Returned", "Outstanding", "Status"], rows, [6])}
      </section>
    </div>
  `;
}

function renderReconciliation() {
  return `
    <div class="screen">
      <div class="section-head">
        <div><h2>Batch Reconciliation</h2><p>Focused discrepancy review for the active demo batch. This screen intentionally shows one exact outstanding linen item.</p></div>
        ${actionButton("danger", "Escalate Exception", icon.reconcile, "noop")}
      </div>
      <section class="grid-4">
        ${metric("Batch ID", demoBatch.id, "Active demo batch", "teal")}
        ${metric("Sent", demoBatch.sent, "Initial laundry dispatch")}
        ${metric("Returned", demoBatch.returned, "Confirmed clean returns", "teal")}
        ${metric("Outstanding", demoBatch.outstanding, "Exact missing item", "red")}
      </section>
      <section class="grid-3">
        <article class="card span-2">
          <div class="card-title"><h3>Outstanding Item</h3>${badge("Operational Exception")}</div>
          ${table(["Linen ID", "EPC", "Type", "Last Known Location", "Last Scan Time", "Last Reader"], [[demoBatch.exactItem, "EPC-3008-0008", "Bath Towel", demoBatch.lastLocation, demoBatch.lastScanTime, demoBatch.lastReader]])}
        </article>
        <article class="card">
          <div class="card-title"><h3>Operational Insight</h3>${badge("Action Needed")}</div>
          <p>The item was seen at the dispatch gate but not confirmed in the clean-return scan. Inspect outbound staging and re-scan the cart before retiring or charging the item.</p>
        </article>
      </section>
      <section class="card">
        <div class="card-title"><h3>Location Trace</h3>${badge("Last known path")}</div>
        <div class="mini-map">
          <div class="zone">Housekeeping</div><div class="zone">Service Lift</div><div class="zone active">Laundry Receiving</div><div class="zone alert">Dispatch Gate</div>
          <div class="zone">Room 702</div><div class="zone">Linen Room</div><div class="zone active">Wash Line</div><div class="zone">Clean Storage</div>
          <div class="zone">Lobby</div><div class="zone">Banquet</div><div class="zone">Pool</div><div class="zone">Vendor Exit</div>
        </div>
      </section>
    </div>
  `;
}

function renderDeviceActivity() {
  return `
    <div class="screen">
      <div class="section-head">
        <div><h2>Device Activity</h2><p>Reader session telemetry with explicit reader type, operation mode, checkpoint, upload status, and created transaction.</p></div>
        ${badge("Simulator, Handheld, Fixed Reader Emulator, Fixed Reader")}
      </div>
      <section class="grid-4">
        ${metric("Active Readers", "4", "Across demo and fixed checkpoints", "teal")}
        ${metric("Auto Uploads", "1", "Fixed Reader Emulator monitoring", "gold")}
        ${metric("Handheld Sessions", "1", "Manual confirmation workflow")}
        ${metric("Unique Tags Today", "57", "Website-only simulated count", "teal")}
      </section>
      <section class="card tight">
        ${table(["Timestamp", "Reader ID", "Reader Type", "Operation Mode", "Checkpoint", "Session ID", "Unique Tags", "Upload Status", "Created Transaction"], state.deviceSessions, [2, 3, 7, 8])}
      </section>
    </div>
  `;
}

function renderTransactionHistory() {
  return `
    <div class="screen">
      <div class="section-head">
        <div><h2>Transaction History</h2><p>Confirmed and uploaded RFID transactions produced by handheld scans, simulation, or fixed reader monitoring.</p></div>
        ${actionButton("secondary", "Export View", icon.upload, "noop")}
      </div>
      <section class="card tight">
        ${table(["Transaction ID", "Activity", "Reference", "Result", "Reader", "Timestamp", "Status"], state.transactions, [6])}
      </section>
    </div>
  `;
}

function renderAssetManagement() {
  const rows = [
    ["AST-ROOM-104", "Ironing Board", "Housekeeping", "Floor 4 Store", "Healthy"],
    ["AST-BQT-018", "Banquet Trolley", "Banquet", "Service Corridor", "In Use"],
    ["AST-LDY-006", "Laundry Cart", "Laundry", "Central Laundry", "Inspection Due"],
    ["AST-FNB-022", "Coffee Urn", "F&B", "Banquet Prep", "Healthy"]
  ];
  return `
    <div class="screen">
      <div class="section-head">
        <div><h2>Asset Management</h2><p>Potential expansion use case. This is intentionally separate from the demonstrated Crowne Plaza linen deployment.</p></div>
        ${badge("Potential Expansion Use Case")}
      </div>
      <section class="asset-banner">
        <div>
          <strong>Expansion concept only</strong>
          <span>Use this screen to show how the same RFID platform could later track non-linen hotel assets.</span>
        </div>
        ${badge("Not part of live linen deployment")}
      </section>
      <section class="grid-4">
        ${metric("Tracked Assets", "128", "Expansion scenario only", "teal")}
        ${metric("Departments", "6", "Example asset categories")}
        ${metric("Inspection Due", "3", "Pending maintenance", "gold")}
        ${metric("Exceptions", "0", "No active asset incident", "teal")}
      </section>
      <section class="card tight">
        ${table(["Asset ID", "Asset Name", "Department", "Last Location", "Status"], rows, [4])}
      </section>
    </div>
  `;
}

function bindScreenEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      renderScreen();
    });
  });

  const openReconciliation = document.getElementById("openReconciliation");
  if (openReconciliation) openReconciliation.addEventListener("click", () => setScreen("reconciliation"));

  const startScan = document.getElementById("startScan");
  if (startScan) startScan.addEventListener("click", startScanning);

  const stopScan = document.getElementById("stopScan");
  if (stopScan) stopScan.addEventListener("click", stopScanning);

  const confirmTransaction = document.getElementById("confirmTransaction");
  if (confirmTransaction) confirmTransaction.addEventListener("click", confirmScanTransaction);

  const startMonitoring = document.getElementById("startMonitoring");
  if (startMonitoring) startMonitoring.addEventListener("click", startMonitoringWindow);

  const stopMonitoring = document.getElementById("stopMonitoring");
  if (stopMonitoring) stopMonitoring.addEventListener("click", stopMonitoringWindow);
}

function startScanning() {
  state.scanning = true;
  appendRead("HH-MGR-04", "Handheld", "Handheld Operation", "Valid");
  scanTimer = window.setInterval(() => appendRead("HH-MGR-04", "Handheld", "Handheld Operation", "Valid"), 3500);
  renderScreen();
}

function stopScanning() {
  state.scanning = false;
  window.clearInterval(scanTimer);
  scanTimer = null;
  renderScreen();
}

function appendRead(readerId, readerType, mode, status) {
  const index = (state.reads.length % 7) + 1;
  const padded = String(index).padStart(4, "0");
  const now = new Date();
  state.reads.unshift([
    `EPC-3008-${padded}`,
    `LN-TWL-${String(index).padStart(3, "0")}`,
    index % 3 === 0 ? "King Sheet" : "Bath Towel",
    readerId,
    readerType,
    mode,
    `${-46 - index} dBm`,
    now.toLocaleTimeString("en-GB"),
    status
  ]);
  state.reads = state.reads.slice(0, 9);
}

function confirmScanTransaction() {
  const transactionId = `TXN-${10032 + state.transactions.length}`;
  state.transactions.unshift([transactionId, "Laundry Return", demoBatch.id, "7 returned, 1 outstanding", "HH-MGR-04", new Date().toLocaleTimeString("en-GB"), "Confirmed"]);
  setScreen("transaction-history");
}

function startMonitoringWindow() {
  state.monitoring = true;
  state.countdown = 30;
  appendRead("FX-LDY-02", "Fixed Reader Emulator", "Website Simulation", "Valid");
  monitorTimer = window.setInterval(() => {
    state.countdown -= 1;
    if (state.countdown <= 0) {
      appendRead("FX-LDY-02", "Fixed Reader Emulator", "Website Simulation", "Auto Uploaded");
      state.countdown = 30;
    }
    if (state.screen === "rfid-scan") renderScreen();
  }, 1000);
  renderScreen();
}

function stopMonitoringWindow() {
  state.monitoring = false;
  window.clearInterval(monitorTimer);
  monitorTimer = null;
  renderScreen();
}

document.getElementById("globalSearch").addEventListener("search", (event) => {
  if (event.target.value.trim()) setScreen("transaction-history");
});

document.getElementById("globalSearch").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.value.trim()) setScreen("transaction-history");
});

renderNav();
setScreen("dashboard");
