# Current State — Porta Nusa Hotel RFID Linen Visibility Platform

Single source of truth for project progress and architecture.

## Repository

* **Path:** `C:\Users\Admin\Documents\RFID Demo`
* **Branch:** `android-integration`
* **Remote:** `origin/android-integration`
* **Latest commit:** `7466e0b docs: close RFID read range power control milestone`

### Recent commits

```
7466e0b docs: close RFID read range power control milestone
c6aa6ce feat: add RFID read range power profile control
4f3a589 docs: close dynamic laundry reconciliation milestone
6dc012f fix: support dynamic laundry batch reconciliation
0b707f5 feat: poll hardware unknown EPC queue
```

### Working tree status

Not clean. Untracked additions:
* `docs/` — screenshot assets and manifest (new, not yet committed)
* `web/app/guides/operator-checklist/` — operator checklist guide route (new, not yet committed)

Modified (uncommitted):
* `web/app/guides/hardware/page.tsx`
* `web/app/guides/simulation/page.tsx`
* `web/app/guides/system-overview/page.tsx`
* `web/components/app-shell.tsx`

Build and runtime artifacts also show as modified (`.gradle/`, `app/build/`, `web/prisma/*.db`, `web/tsconfig.tsbuildinfo`) — these must not be committed.

---

## Architecture

```
Simulation Browser  →  X-Demo-Mode: SIMULATION  →  simulation.db
Hardware Browser    →  X-Demo-Mode: HARDWARE    →  hardware.db
Chainway C5 Android →  X-Demo-Mode: HARDWARE    →  hardware.db
```

* `web/` — Next.js 14 App Router, Prisma ORM, SQLite, server components, RFID HTTP API
* `android/chainway-edge-app/` — Chainway C5 E710 Android (Kotlin, `RFIDWithUHFUART` SDK)
* Middleware injects `X-Demo-Mode` header from the `demoMode` cookie
* Android hardcodes `X-Demo-Mode: HARDWARE` in every API request
* Web/API is the sole owner of validation and business logic
* No shared state between `simulation.db` and `hardware.db`

---

## Completed Capabilities

### Core Platform
* Porta Nusa Hotel branding
* Simulation Mode and Hardware Mode
* Isolated `simulation.db` and `hardware.db`
* Mode-aware Web UI
* Chainway C5 E710 Android integration
* Physical RFID trigger and EPC/RSSI capture with deduplication
* `STOCK_COUNT` workflow
* `SEND_TO_LAUNDRY` workflow
* `RETURN_FROM_LAUNDRY` workflow
* Retry logic and idempotency
* Simulation Data Management (generate / clear, capped at 100 items)
* Web-first physical EPC registration
* Unknown EPC live polling every ~2.5 seconds (Hardware Linen Master)

### Dynamic Laundry Batch and Reconciliation Logic Fix

**Milestone status: CLOSED**

Root causes resolved:
* Reconciliation was hardcoded to `LB-DEMO-001` — eliminated
* `calculateReconciliation` used Set deduplication — replaced with count-per-EPC map
* `SEND_TO_LAUNDRY` now find-or-creates the batch using the exact submitted code
* Laundry Batches status column now computed from live counts, not stale stored value

Business rules in effect:
* `outstanding = acceptedSent - validReturned` (per EPC, count-based)
* `outstanding > 0` → In Progress; `outstanding = 0 and acceptedSent > 0` → Completed
* Every submitted batch code is independent
* Reconciliation shows every active-mode batch with `outstanding > 0`

**Verification:**
* `CODE VERIFIED` — all changes reviewed against business rules
* `BUILD VERIFIED` — `npx tsc --noEmit` clean; `npx next build` passes all 14 routes
* `AUTOMATED TESTED` — 17/17 assertions: Batch A send/partial/full return; Batch B independence, wrong-batch rejection, partial return; hardware batch with no `LB-DEMO-001` dependency
* `BROWSER VERIFIED` — Hardware mode: `LB-HW-1` Sent 9 / Returned 5 / Outstanding 4 / In Progress; Simulation empty state confirmed; database isolation confirmed
* `DEVICE VERIFIED` — Chainway C5 with real RFID tags in Hardware Mode
* `PHYSICALLY VERIFIED` — Dynamic SEND creation, partial return In Progress, `WRONG_BATCH` rejection, `ALREADY_RETURNED` rejection, full return Completed, batch removed from Reconciliation, empty state confirmed. Evidence file: `Testing fitur demo rfid.docx`

DEPLOYMENT VERIFIED: not claimed.

### RFID Read Range & Power Control

**Milestone status: CLOSED — commit `c6aa6ce`**

What was implemented:
* `PowerProfile` enum: `NEAR(5)`, `MEDIUM(18)`, `FAR(30)` — integer values passed directly to `RFIDWithUHFUART.setPower()`. Default: `MEDIUM`
* Settings panel (`layoutSettings`) includes "Read Range / Power" spinner
* Profile persisted to `SharedPreferences` key `PowerProfile` on explicit SAVE CONFIGURATION only
* Profile restored into spinner on app start via `loadPrefs()` — no `setPower()` called at restore
* `setPower()` called in try/catch before every `startInventoryTag()` — both UI button and physical trigger share the single `startInventory()` call site
* Exception or `false` return from `setPower()` stops scan; operator sees "Status: FAILED TO SET POWER"
* Web/API, database schema, and laundry business logic unchanged

Files changed: `MainActivity.kt`, `activity_main.xml`

**Verification:**
* `CODE VERIFIED` — mapping, default, persistence load/save, failure paths, single call site confirmed
* `BUILD VERIFIED` — `.\gradlew.bat assembleDebug` clean. APK: `app-debug.apk` 11.1 MB, 28 Jun 2026. Kotlin 1.8 compatibility fix applied (`entries` → `values()`)
* `DEVICE VERIFIED` — APK installed on Chainway C5; spinner UI confirmed
* `PHYSICALLY VERIFIED` — Near narrowest / Medium intermediate / Far widest comparison passed; persistence after restart passed; physical trigger functional; `STOCK_COUNT`, `SEND_TO_LAUNDRY`, `RETURN_FROM_LAUNDRY` regression passed

DEPLOYMENT VERIFIED: not claimed.

### In-App Documentation & Demo Readiness

**Milestone status: CLOSED**

Four guide routes implemented as rich inline TSX server components (no PDF renderer, no markdown dependencies):

| Route | Title |
|---|---|
| `/guides/system-overview` | System Overview (Technical Documentation) |
| `/guides/simulation` | Simulation Mode User Guide |
| `/guides/hardware` | Hardware Mode User Guide |
| `/guides/operator-checklist` | Demo Operator Checklist |

Navigation behavior in `app-shell.tsx`:
* **System Overview** and **Demo Operator Checklist** appear under a global DOCUMENTATION section — visible in both modes
* **Simulation Guidance** link appears in the Simulation Tools section (Simulation Mode only)
* **Hardware Setup Guidance** link appears in the Hardware Tools section (Hardware Mode only)
* Existing guide topbar (`DOCUMENTATION / Guide Preview`) and "Return to Demo" link preserved

Files changed: `web/components/app-shell.tsx`, `web/app/guides/system-overview/page.tsx`, `web/app/guides/simulation/page.tsx`, `web/app/guides/hardware/page.tsx`, `web/app/guides/operator-checklist/page.tsx` (new)

**Verification:**
* `CODE VERIFIED` — TypeScript; all routes render as server components with no client-side dependencies
* `BUILD VERIFIED` — `npx next build` passes; all guide routes compiled without errors
* `BROWSER VERIFIED` — All four routes loaded and rendered correctly in Chrome. Navigation links confirmed in both Simulation and Hardware Mode sidebars

DEPLOYMENT VERIFIED: not claimed.

### Screenshot Capture

**Milestone status: CLOSED**

Assets located at `docs/screenshots/`. Manifest: `docs/screenshots/SCREENSHOT_MANIFEST.md`.

**Web screenshots (14 files):**

| File | Description |
|---|---|
| `web/web_00_landing_mode_selection.png` | Landing page — mode selection cards |
| `web/web_01_hw_dashboard.png` | Hardware Mode Dashboard (Available: 3, Tx: 4) |
| `web/web_02_hw_linen_master.png` | Hardware Mode Linen Master |
| `web/web_03_hw_laundry_batches.png` | Hardware Mode Laundry Batches |
| `web/web_04_hw_reconciliation.png` | Hardware Mode Reconciliation |
| `web/web_05_hw_transaction_history.png` | Hardware Mode Transaction History |
| `web/web_06_hw_device_activity.png` | Hardware Mode Device Activity |
| `web/web_07_hw_rfid_scan.png` | Hardware Mode RFID Scan |
| `web/web_08_sim_dashboard.png` | Simulation Mode Dashboard (Available: 20) |
| `web/web_09_sim_rfid_scan.png` | Simulation Mode RFID Scan |
| `web/web_10_guide_system_overview.png` | System Overview guide |
| `web/web_11_guide_simulation.png` | Simulation Mode guide |
| `web/web_12_guide_hardware.png` | Hardware Mode guide |
| `web/web_13_guide_operator_checklist.png` | Demo Operator Checklist guide |

**Android screenshots (8 files):**

| File | Description |
|---|---|
| `android/c5_main_idle.png` | C5 main screen, idle |
| `android/c5_new_session.png` | C5 new session panel |
| `android/c5_transaction_dropdown.png` | C5 workflow type dropdown (all 3 types) |
| `android/c5_settings.png` | C5 Settings panel (Server URL, Reader ID, Power: Near) |
| `android/c5_stock_count_scanning.png` | C5 live STOCK_COUNT scan (Reads: 77, Unique: 2) |
| `android/c5_stock_count_result.png` | C5 STOCK_COUNT stopped, RETRY UPLOAD shown |
| `android/c5_stock_count_accepted.png` | C5 STOCK_COUNT after retry: Accepted 2, both ACCEPTED |
| `android/c5_return_from_laundry_accepted.png` | C5 RETURN_FROM_LAUNDRY: 14 ACCEPTED results |

**Not captured (optional enhancement assets, not milestone blockers):**
* C5 SEND_TO_LAUNDRY accepted-result screenshot
* C5 `WRONG_BATCH` rejection screenshot

**Verification:**
* `BROWSER VERIFIED` — Chrome MCP navigation confirmed each page loaded; all 14 web screenshots captured through browser navigation; all four guide routes rendered successfully
* `DEVICE VERIFIED` — 8 Android screenshots captured via ADB from Chainway C5 `636e8268`

Screenshots may reflect environment-specific demo data (simulation.db had 20 items; hardware.db had 3 items at time of capture). Screenshots do not independently constitute physical workflow provenance.

---

## Documentation Status

| Deliverable | Status |
|---|---|
| Technical Documentation (in-app) | Complete |
| Simulation Mode User Guide (in-app) | Complete |
| Hardware Mode User Guide (in-app) | Complete |
| Demo Operator Checklist (in-app) | Complete |
| Screenshot asset package | Complete — 22 PNG files (8 Android, 14 Web) |
| PDF Documentation Package | Not yet created |
| Partner-Ready PPTX | Not yet created |
| Docker + Cloudflare deployment | Not yet performed |

---

## Deployment Plan

Target domain: `linen.alinktech.my.id`

Planned stack: Docker + Cloudflare, manual deployment by Owner.

Deployment has been intentionally deferred. `DEPLOYMENT VERIFIED` is not claimed for any milestone.

---

## Known Limitations and Open Items

* Deployment to `linen.alinktech.my.id` not yet performed
* PDF documentation package not yet created
* Partner-ready PPTX not yet created
* C5 SEND_TO_LAUNDRY accepted-result screenshot not captured
* C5 `WRONG_BATCH` rejection screenshot not captured
* Screenshots reflect environment-specific demo data at time of capture
* Working tree is not clean (docs/ and guide pages are uncommitted)

---

## Active Next Milestone

**PDF Documentation Package**

Use the in-app documentation routes as primary content source. Use `docs/screenshots/` as the asset package. Create a professional PDF distinguishing Simulation and Hardware workflows. Do not change application source, business logic, or databases.

Following milestone: **Partner-Ready PPTX**

After both documentation deliverables: **Docker + Cloudflare deployment** (manual, by Owner).
