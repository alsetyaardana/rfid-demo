# Current State - Porta Nusa Hotel RFID Linen Visibility Platform

Single source of truth for project progress and architecture.

## Repository

* **Path:** `C:\Users\Admin\Documents\RFID Demo`
* **Branch:** `android-integration`
* **Remote:** `origin/android-integration`
* **Latest commit:** `docs: finalize local demo package and repository handoff` (see git log for hash)

### Recent commits

```text
docs: finalize local demo package and repository handoff
72bf84d feat: add hardware database lifecycle CLI
858a9e1 fix: align simulation controls and operator guidance
326a778 docs: complete in-app guides and screenshot package
```

### Working tree status

Clean after final repository closure commit. Runtime/build artifacts (`.gradle/`, `app/build/`, `web/prisma/*.db`, `web/tsconfig.tsbuildinfo`) are now properly gitignored and removed from the index. Android build directories were untracked from the index in the closure commit.

---

## Architecture

```text
Simulation Browser  ->  X-Demo-Mode: SIMULATION  ->  simulation.db
Hardware Browser    ->  X-Demo-Mode: HARDWARE    ->  hardware.db
Chainway C5 Android ->  X-Demo-Mode: HARDWARE    ->  hardware.db
```

* `web/` - Next.js 14 App Router, Prisma ORM, SQLite, server components, RFID HTTP API
* `android/chainway-edge-app/` - Chainway C5 E710 Android (Kotlin, `RFIDWithUHFUART` SDK)
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
* Reconciliation was hardcoded to `LB-DEMO-001` - eliminated
* `calculateReconciliation` used Set deduplication - replaced with count-per-EPC map
* `SEND_TO_LAUNDRY` now find-or-creates the batch using the exact submitted code
* Laundry Batches status column now computed from live counts, not stale stored value

Business rules in effect:
* `outstanding = acceptedSent - validReturned` (per EPC, count-based)
* `outstanding > 0` -> In Progress; `outstanding = 0 and acceptedSent > 0` -> Completed
* Every submitted batch code is independent
* Reconciliation shows every active-mode batch with `outstanding > 0`

**Verification:**
* `CODE VERIFIED` - all changes reviewed against business rules
* `BUILD VERIFIED` - `npx tsc --noEmit` clean; `npx next build` passes all 14 routes
* `AUTOMATED TESTED` - 17/17 assertions: Batch A send/partial/full return; Batch B independence, wrong-batch rejection, partial return; hardware batch with no `LB-DEMO-001` dependency
* `BROWSER VERIFIED` - Hardware mode: `LB-HW-1` Sent 9 / Returned 5 / Outstanding 4 / In Progress; Simulation empty state confirmed; database isolation confirmed
* `DEVICE VERIFIED` - Chainway C5 with real RFID tags in Hardware Mode
* `PHYSICALLY VERIFIED` - Dynamic SEND creation, partial return In Progress, `WRONG_BATCH` rejection, `ALREADY_RETURNED` rejection, full return Completed, batch removed from Reconciliation, empty state confirmed. Evidence file: `Testing fitur demo rfid.docx`

DEPLOYMENT VERIFIED: not claimed.

### RFID Read Range & Power Control

**Milestone status: CLOSED - commit `c6aa6ce`**

What was implemented:
* `PowerProfile` enum: `NEAR(5)`, `MEDIUM(18)`, `FAR(30)` - integer values passed directly to `RFIDWithUHFUART.setPower()`. Default: `MEDIUM`
* Settings panel (`layoutSettings`) includes "Read Range / Power" spinner
* Profile persisted to `SharedPreferences` key `PowerProfile` on explicit SAVE CONFIGURATION only
* Profile restored into spinner on app start via `loadPrefs()` - no `setPower()` called at restore
* `setPower()` called in try/catch before every `startInventoryTag()` - both UI button and physical trigger share the single `startInventory()` call site
* Exception or `false` return from `setPower()` stops scan; operator sees "Status: FAILED TO SET POWER"
* Web/API, database schema, and laundry business logic unchanged

Files changed: `MainActivity.kt`, `activity_main.xml`

**Verification:**
* `CODE VERIFIED` - mapping, default, persistence load/save, failure paths, single call site confirmed
* `BUILD VERIFIED` - `.\gradlew.bat assembleDebug` clean. APK: `app-debug.apk` 11.1 MB, 28 Jun 2026. Kotlin 1.8 compatibility fix applied (`entries` -> `values()`)
* `DEVICE VERIFIED` - APK installed on Chainway C5; spinner UI confirmed
* `PHYSICALLY VERIFIED` - Near narrowest / Medium intermediate / Far widest comparison passed; persistence after restart passed; physical trigger functional; `STOCK_COUNT`, `SEND_TO_LAUNDRY`, `RETURN_FROM_LAUNDRY` regression passed

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
* **System Overview** and **Demo Operator Checklist** appear under a global DOCUMENTATION section - visible in both modes
* **Simulation Guidance** link appears in the Simulation Tools section (Simulation Mode only)
* **Hardware Setup Guidance** link appears in the Hardware Tools section (Hardware Mode only)
* Existing guide topbar (`DOCUMENTATION / Guide Preview`) and "Return to Demo" link preserved

Files changed: `web/components/app-shell.tsx`, `web/app/guides/system-overview/page.tsx`, `web/app/guides/simulation/page.tsx`, `web/app/guides/hardware/page.tsx`, `web/app/guides/operator-checklist/page.tsx` (new)

**Verification:**
* `CODE VERIFIED` - TypeScript; all routes render as server components with no client-side dependencies
* `BUILD VERIFIED` - `npx next build` passes; all guide routes compiled without errors
* `BROWSER VERIFIED` - All four routes loaded and rendered correctly in Chrome. Navigation links confirmed in both Simulation and Hardware Mode sidebars

DEPLOYMENT VERIFIED: not claimed.

### Screenshot Capture

**Milestone status: CLOSED**

Assets located at `docs/screenshots/`. Manifest: `docs/screenshots/SCREENSHOT_MANIFEST.md`.

**Web screenshots (14 files):**

| File | Description |
|---|---|
| `web/web_00_landing_mode_selection.png` | Landing page - mode selection cards |
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
* `BROWSER VERIFIED` - Chrome MCP navigation confirmed each page loaded; all 14 web screenshots captured through browser navigation; all four guide routes rendered successfully
* `DEVICE VERIFIED` - 8 Android screenshots captured via ADB from Chainway C5 `636e8268`

Screenshots may reflect environment-specific demo data (simulation.db had 20 items; hardware.db had 3 items at time of capture). Screenshots do not independently constitute physical workflow provenance.

### Simulation UI Consistency & Operator Safety Fix

**Milestone status: CLOSED**

What was implemented:
* Dashboard `Simulation Data Management` is now the canonical location for `Generate Demo Data`, `Clear Generated Data`, and `Reset Database`
* Simulation sidebar disabled action affordances were removed and replaced with an `Open Simulation Data Management` link
* Simulation RFID page was redesigned as a read-only latest-session visibility page; misleading browser-side scan controls and faux telemetry affordances were removed
* Simulation Guide, Operator Checklist, and System Overview were updated to match the current product behavior
* Selective screenshots were recaptured: `web_08_sim_dashboard.png`, `web_09_sim_rfid_scan.png`, `web_11_guide_simulation.png`, `web_13_guide_operator_checklist.png`

Files changed:
* `web/app/page.tsx`
* `web/app/rfid-scan/page.tsx`
* `web/components/app-shell.tsx`
* `web/components/demo-actions.tsx`
* `web/components/mode-panels/RfidScanPanels.tsx`
* `web/app/guides/system-overview/page.tsx`
* `web/app/guides/simulation/page.tsx`
* `web/app/guides/operator-checklist/page.tsx`
* `docs/screenshots/SCREENSHOT_MANIFEST.md`

**Verification:**
* `CODE VERIFIED` - Simulation UI text, navigation, and guide references aligned with the approved behavior
* `BUILD VERIFIED` - `npx.cmd tsc --noEmit` clean after fresh build; `npm.cmd run build` passed all 17 app routes
* `BROWSER VERIFIED` - Simulation Dashboard, RFID Scan, Simulation Guide, and Operator Checklist validated on localhost; Dashboard buttons `Clear Generated Data`, `Generate Demo Data`, and `Reset Database` click-tested successfully
* `BROWSER VERIFIED` - Hardware Dashboard smoke check passed after Simulation changes

DEPLOYMENT VERIFIED: not claimed.

### Hardware Demo Baseline & Reset Workflow - CLI Only

**Milestone status: IMPLEMENTED**

What was implemented:
* Hardware-only CLI scripts: `hardware:init`, `hardware:backup`, `hardware:reset`, `hardware:verify`
* Safe helper layer in `web/scripts/` with explicit `file:./hardware.db` targeting
* Canonical Hardware baseline initializer for:
  * `LINEN-RM | Main Linen Room | STORAGE`
  * `EXT-LDY | Central Laundry | LAUNDRY`
* Timestamped backup flow under `web/prisma/backups/hardware/`
* Hardware-only reset flow: backup -> delete hardware DB files -> `prisma migrate deploy` against `hardware.db` only -> initialize baseline -> verify
* CLI runbook: `docs/HARDWARE_DATABASE_RUNBOOK.md`

Files changed:
* `.gitignore`
* `docs/HARDWARE_DATABASE_RUNBOOK.md`
* `web/package.json`
* `web/scripts/hardware-db-utils.js`
* `web/scripts/hardware-init.js`
* `web/scripts/hardware-backup.js`
* `web/scripts/hardware-reset.js`
* `web/scripts/hardware-verify.js`

**Verification:**
* `CODE VERIFIED` - hardware-only datasource isolation and backup/reset flow reviewed against milestone constraints
* `AUTOMATED TESTED` - `hardware:init` idempotency, `hardware:backup`, one-command `hardware:reset`, and `hardware:verify` PASS confirmed on Windows; `simulation.db` size, timestamp, and counts unchanged before/after reset

DEPLOYMENT VERIFIED: not claimed.

---

## Documentation Status

| Deliverable | Status |
|---|---|
| Technical Documentation (in-app) | Complete |
| Simulation Mode User Guide (in-app) | Complete |
| Hardware Mode User Guide (in-app) | Complete |
| Demo Operator Checklist (in-app) | Complete |
| Hardware database CLI runbook | Complete |
| Screenshot asset package | Complete - 22 PNG files (8 Android, 14 Web) |
| PDF Documentation Package | **Complete** - `docs/share/porta-nusa-rfid-documentation-package.pdf` |
| Solution FAQ | **Complete** - `docs/share/porta-nusa-solution-faq.pdf` |
| Partner-Ready PPTX | Not yet created (deferred) |
| Docker + Cloudflare deployment | Not yet performed (deferred) |

---

## Repository Closure

### Final Repository Handoff - CLOSED

**Milestone status: CLOSED**

What was completed:
* `.gitignore` extended: `simulation.db`, `tsconfig.tsbuildinfo`, correct Android build paths (`android/chainway-edge-app/.gradle/`, `android/chainway-edge-app/app/build/`), `.agents/`, `.claude/`, `output/`, `tmp/`, `local-archive/`
* Tracked build artifacts removed from git index: `android/chainway-edge-app/.gradle/`, `android/chainway-edge-app/app/build/`, `web/prisma/simulation.db`, `web/tsconfig.tsbuildinfo`
* `docs/share/` created with two partner-safe PDFs and README
* `docs/internal/` created with source records
* `tools/docs/` created with PDF generation scripts
* `README.md` rewritten as comprehensive recovery guide (Node version, setup commands, env vars, database lifecycle, troubleshooting)
* `CURRENT_STATE.md` and `AGENT_HANDOFF.md` updated to reflect closure

**Verification:**
* `CODE VERIFIED` - gitignore patterns confirmed against actual tracked/untracked file status
* `BUILD VERIFIED` - `npm run build` executed and passed
* `AUTOMATED TESTED` - `hardware:verify` passed
* PDF existence confirmed: both docs/share/ PDFs present and non-zero

DEPLOYMENT VERIFIED: not claimed.

---

## Deployment Plan

Target domain: `linen.alinktech.my.id`

Planned stack: Docker + Cloudflare, manual deployment by Owner.

Deployment has been intentionally deferred. `DEPLOYMENT VERIFIED` is not claimed for any milestone.

---

## Known Limitations and Open Items

* Deployment to `linen.alinktech.my.id` not yet performed
* Partner-ready PPTX not yet created (deferred beyond current scope)
* C5 SEND_TO_LAUNDRY accepted-result screenshot not captured (optional enhancement)
* C5 `WRONG_BATCH` rejection screenshot not captured (optional enhancement)
* Screenshots reflect environment-specific demo data at time of capture

---

## Project Status

**Project closed for current local-demo scope.**

All approved milestones are complete. Next actions (if pursued) are Owner-initiated:
* Partner-Ready PPTX (deferred)
* Docker + Cloudflare deployment to `linen.alinktech.my.id` (deferred, manual by Owner)
