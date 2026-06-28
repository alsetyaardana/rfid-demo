# Current State of the RFID Linen Visibility Platform

This document serves as the single source of truth for the project's progress and current architecture.

## Completed Milestones

* **Web MVP and RFID API**: Base operational dashboards and unified HTTP API stable.
* **Android SDK Integration**: Chainway C5 E710 module integrated successfully.
* **Handheld Workflows**: `STOCK_COUNT`, `SEND_TO_LAUNDRY`, and `RETURN_FROM_LAUNDRY` flows are fully operational.
* **Core Hardware Features**: Real-time tag list deduplication, API retry logic, and idempotency built-in.
* **Dual Database Architecture**: Complete structural isolation between `simulation.db` and `hardware.db`.
* **Mode-Aware UI**: Operational UI cleanly distinguishes between browser simulation workflows and hardware monitoring workflows.
* **Simulation Data Management**: Robust, dynamic data generation and reset logic (capped safely at 100 records).
* **Quick Physical EPC Registration**: Hardware Linen Master panel safely captures `UNKNOWN_EPC`s and commits them to `hardware.db`.
* **Web-First Physical EPC Registration Polling**: Hardware Linen Master polls for physical `UNKNOWN_EPC`s every 2.5 seconds and updates the registration queue without a manual browser refresh.
* **C5 Physical Upload Validation**: Repository-built APK installed on Chainway C5 and confirmed to upload a fresh `STOCK_COUNT` session to `hardware.db`; the fresh `UNKNOWN_EPC` appeared in the Web registration queue.
* **Branding**: Full transition to "Porta Nusa Hotel" and "Porta Nusa Operator" branding.
* **Dynamic Laundry Batch and Reconciliation Logic Fix**: All batch and reconciliation logic corrected. `CODE VERIFIED`, `BUILD VERIFIED`, `AUTOMATED TESTED` (17/17), `BROWSER VERIFIED`, `DEVICE VERIFIED`, and `PHYSICALLY VERIFIED`. Milestone closed. Evidence file: `Testing fitur demo rfid.docx`.

## Current Architecture

* **Simulation Browser** -> sends `X-Demo-Mode: SIMULATION` via middleware -> writes to `simulation.db`
* **Hardware Browser** -> sends `X-Demo-Mode: HARDWARE` via middleware -> reads/writes to `hardware.db`
* **Chainway C5 Android** -> always injects `X-Demo-Mode: HARDWARE` headers -> reads/writes to `hardware.db`

*Note: There is absolutely no shared state between the two SQLite databases. `hardware.db` starts empty and strictly limits linen creation to 100 items.*

## Completed Flow: Web-First Physical EPC Registration

Registration remains Web-first while the Android app only uploads RFID sessions.

**Flow:**
1. C5 scans tag.
2. Android uploads RFID session payload.
3. Server stores `UNKNOWN_EPC` result in `hardware.db`.
4. Hardware Linen Master UI polls every 2.5 seconds for recent unknown EPCs.
5. Unknown EPC automatically appears in the Web registration queue.
6. Operator registers Linen Code and Linen Type on the Web UI.
7. Server validates and saves to `hardware.db`.
8. Next hardware scan recognizes the EPC immediately.

**Latest physical validation:** A repository-built APK was installed on Chainway C5 `636e8268`. A fresh `STOCK_COUNT` upload for EPC `494E562D4153542D30303031` reached `http://10.10.101.45:3000/api/rfid/read-sessions`, persisted to the active `web/prisma/hardware.db` with `validationStatus=UNKNOWN_EPC`, and appeared in `GET /api/hardware/unknown-epcs`.

## Completed Fix: Dynamic Laundry Batch and Reconciliation Logic

All batch and reconciliation logic has been rewritten to use count-based item quantities. The hardcoded `LB-DEMO-001` dependency has been removed from all server-side queries and UI pages.

**What changed:**
* `SEND_TO_LAUNDRY` now safely find-or-creates the batch using the exact submitted batch code.
* `calculateReconciliation` uses count-per-EPC map logic instead of Set deduplication.
* `getReconciliationData` returns all batches with `outstanding > 0` as an array.
* Dashboard, RFID scan, and reconciliation queries no longer reference `LB-DEMO-001`.
* Laundry Batches status column is now computed from live `sent`/`outstanding` counts, not the stale stored `batch.status`.
* Reconciliation page renders independently per outstanding batch.

**Browser-verified evidence for `LB-HW-1`:**
* Laundry Batches: Sent 9, Returned 5, Outstanding 4, Status **In Progress**
* Reconciliation: Active Batches 1, Total Sent 9, Total Returned 5, Total Outstanding 4
* No `LB-DEMO-001` dependency found in any hardware-mode response.
* Simulation mode isolated: `LB-HW-1` not visible, empty state rendered correctly.

**Physical validation result (milestone closed):**
* Validated on Chainway C5 with real RFID tags in Hardware Mode.
* Two independent laundry batches validated.
* Dynamic `SEND_TO_LAUNDRY` batch creation passed.
* Partial return kept the batch In Progress.
* Wrong-batch return rejected with `WRONG_BATCH`.
* Repeated return rejected with `ALREADY_RETURNED`.
* Correct returns affected only the submitted batch.
* Full return produced Outstanding 0 and Completed status.
* Completed batches disappeared from Reconciliation.
* Reconciliation empty state confirmed after all outstanding items returned.
* Physical execution did not follow the proposed script step-by-step but covered equivalent acceptance criteria and passed.
* Evidence file: `Testing fitur demo rfid.docx`.
* No deployment verification claimed.

## Completed Milestone: RFID Read Range & Power Control

Power profile control has been added to the Chainway C5 Android app. Operators can select Near, Medium, or Far read range before scanning. The selected profile persists across app restarts.

**Implementation commit:** `c6aa6ce`

**What changed:**
* `PowerProfile` enum added: `NEAR(5)`, `MEDIUM(18)`, `FAR(30)` — integer values passed directly to `RFIDWithUHFUART.setPower()`. Default: `MEDIUM`.
* Settings panel (`layoutSettings`) now includes a "Read Range / Power" spinner.
* Profile saved to `SharedPreferences` key `PowerProfile` only on explicit SAVE CONFIGURATION action.
* Profile restored into spinner on app start via `loadPrefs()` — no `setPower()` called at restore time.
* `setPower()` called with try/catch immediately before every `startInventoryTag()`.
* Exception or `false` return from `setPower()` prevents inventory from starting; operator sees "Status: FAILED TO SET POWER".
* Both UI button and physical trigger (C5 side keys) route through the same `startInventory()` — single call site.
* Web/API, database schema, and laundry business logic were not modified.

**Physical validation result (milestone closed):**
* APK installed on Chainway C5 with real RFID tags.
* Settings panel displayed "Read Range / Power" spinner correctly.
* Persistence confirmed: selected Near → SAVE CONFIGURATION → app restart → spinner restored Near.
* Physical comparison passed: Near read area narrowest, Medium intermediate, Far widest.
* Physical trigger (C5 side keys) remained functional throughout.
* Regression passed: `STOCK_COUNT`, `SEND_TO_LAUNDRY`, and `RETURN_FROM_LAUNDRY` all functional with profiles active.
* No deployment verification claimed.

**Verification status:**
* `CODE VERIFIED` — mapping, default, persistence load/save, failure paths, single call site confirmed by code inspection.
* `BUILD VERIFIED` — `.\gradlew.bat assembleDebug` clean. APK: `app-debug.apk` 11.1 MB, 28 Jun 2026.
* `DEVICE VERIFIED` — APK installed and spinner UI confirmed on Chainway C5.
* `PHYSICALLY VERIFIED` — Near/Medium/Far physical range comparison passed; persistence after restart passed; regression passed.

### Milestone status: CLOSED

## Active Defect / Next Approved Milestone

No active defect. Chainway C5 RFID Read Range & Power Control milestone is fully closed. The next milestone requires approval from the Owner/Architect.

## Later Milestones

* **RFID Read Range Profiles**: ~~Implementing power profiles~~ — completed as "RFID Read Range & Power Control". Milestone closed.
* **Final Physical Laundry Acceptance**: Refining real-world transaction accuracy.
* **APK Download Portal**: Allowing direct download of the Android APK from the Web UI.
* **Simulation & Hardware User Guides**: Providing distinct onboarding materials for users.
* **System Overview & Production Deployment**: Getting the MVP live.
* **Event Dress Rehearsal**: Final test of the full ecosystem.
