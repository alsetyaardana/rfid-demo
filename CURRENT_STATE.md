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
* **Dynamic Laundry Batch and Reconciliation Logic Fix**: All batch and reconciliation logic corrected. `CODE VERIFIED`, `BUILD VERIFIED`, `AUTOMATED TESTED` (17/17), and `BROWSER VERIFIED`. Physical C5 validation pending.

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

**Pending physical validation (milestone not fully closed):**
* Physical C5 `SEND_TO_LAUNDRY` using a new batch code that does not yet exist.
* Partial return keeps batch In Progress.
* Full return makes outstanding 0 and status Completed.
* Wrong-batch return is rejected by the server.
* Correct return affects only the submitted batch.

## Active Defect / Next Approved Milestone

No new defect is currently confirmed. The next action is physical C5 validation to fully close the Dynamic Laundry Batch and Reconciliation Logic Fix milestone, followed by approval of the next milestone from the Owner/Architect.

## Later Milestones

* **RFID Read Range Profiles**: Implementing power profiles (`NEAR`, `MEDIUM`, `FAR`, `CUSTOM`).
* **Final Physical Laundry Acceptance**: Refining real-world transaction accuracy.
* **APK Download Portal**: Allowing direct download of the Android APK from the Web UI.
* **Simulation & Hardware User Guides**: Providing distinct onboarding materials for users.
* **System Overview & Production Deployment**: Getting the MVP live.
* **Event Dress Rehearsal**: Final test of the full ecosystem.
