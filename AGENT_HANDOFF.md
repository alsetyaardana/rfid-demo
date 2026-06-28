# Agent Handoff

## Checkpoint

* Repository: `RFID Demo`
* Branch: `android-integration`
* Latest committed checkpoint: `6dc012f`
* Commit subject: `fix: support dynamic laundry batch reconciliation`
* Remote: `origin/android-integration`
* Deployment: no production/server deployment has been performed.

The working method remains Owner/Architect -> PM -> Executor. The coding agent should use repository documentation as the source of truth, work on one approved milestone only, distinguish Confirmed/Inferred/Not Yet Verified, use accurate verification language, avoid auto-proceeding, and stop at the stated stop condition.

## Verification Language

Use only these verification levels when reporting evidence:

* `CODE VERIFIED`
* `BUILD VERIFIED`
* `AUTOMATED TESTED`
* `BROWSER VERIFIED`
* `DEVICE VERIFIED`
* `PHYSICALLY VERIFIED`
* `DEPLOYMENT VERIFIED`

Do not treat build success as workflow completion, scripts as browser or physical validation, ADB input as physical RFID trigger validation, or simulated payloads as real hardware tests.

## Completed Capabilities

* Porta Nusa Hotel RFID Linen Visibility Platform branding.
* Simulation and Hardware mode selection.
* Isolated `simulation.db` and `hardware.db`.
* Mode-aware Web UI.
* Chainway C5 E710 Android integration.
* Physical RFID trigger and EPC/RSSI capture.
* `STOCK_COUNT` workflow.
* `SEND_TO_LAUNDRY` workflow implementation.
* `RETURN_FROM_LAUNDRY` workflow implementation.
* Retry and idempotency.
* Dynamic Simulation Data Management.
* Web-first physical EPC registration.
* Live Hardware unknown-EPC polling every approximately 2.5 seconds.
* Physical flow: C5 unknown scan -> `hardware.db` `UNKNOWN_EPC` -> Web queue -> registration -> rescan accepted.
* Dynamic Laundry Batch and Reconciliation Logic Fix — `CODE VERIFIED`, `BUILD VERIFIED`, `AUTOMATED TESTED` (17/17), `BROWSER VERIFIED`, `DEVICE VERIFIED`, `PHYSICALLY VERIFIED`. Milestone closed. Evidence file: `Testing fitur demo rfid.docx`.

Physical EPC registration polling has been `CODE VERIFIED`, `BUILD VERIFIED`, `BROWSER VERIFIED`, `DEVICE VERIFIED`, and `PHYSICALLY VERIFIED`.

## Android Runtime Finding

A stale Android APK previously caused physical tests not to reach the active local server. This was resolved by building the current APK from `android/chainway-edge-app`, reinstalling `com.hotel.rfid.edge`, setting `ServerUrl` to `http://10.10.101.45:3000`, and confirming a fresh `STOCK_COUNT` request reached `hardware.db`.

No Android registration editor is required. `STOCK_COUNT` is the approved capture path for discovering unregistered EPCs.

## Completed Milestone: Dynamic Laundry Batch and Reconciliation Logic Fix

### What was fixed

**Root causes resolved:**

* Reconciliation was hardcoded to `demoBatchCode` / `LB-DEMO-001`. Hardware batches were invisible.
* `calculateReconciliation` used a `Set` of returned EPCs, allowing one returned EPC to incorrectly clear multiple sent records with the same EPC.
* `SEND_TO_LAUNDRY` found an existing batch but did not create a new one when the submitted batch code was new.
* The Laundry Batches status column displayed the stale stored `batch.status` value instead of the live-computed status.

**Changes implemented:**

* `web/lib/services/rfid-processing.ts`:
  * `SEND_TO_LAUNDRY` now find-or-creates the batch using the exact submitted code and the standard source/destination locations.
  * `calculateReconciliation` replaced Set deduplication with a count-per-EPC map. `outstandingCount = outstanding items after consuming return credits per EPC`.
  * Added `calculateAllBatchesReconciliation` export for dashboard aggregation.

* `web/lib/services/queries.ts`:
  * Removed `demoBatchCode` import. All hardcoded `LB-DEMO-001` references eliminated.
  * `getReconciliationData` returns `Array<{ batch, reconciliation }>` filtered to `outstandingCount > 0`.
  * `getDashboardData` and `getRfidScanData` use `findFirst` (most-recent batch) instead of the fixed batch code lookup.
  * `safeReconciliation` aggregates all batches via `calculateAllBatchesReconciliation`.

* `web/app/reconciliation/page.tsx`:
  * Rewritten to render an empty state or one card per outstanding batch with per-batch metrics and outstanding item table.

* `web/app/laundry-batches/page.tsx`:
  * Status column now computed from live `summaries[index].outstanding` and `summaries[index].sent`, not the stored `batch.status`. Browser validation confirmed `batch.status` was stale (`COMPLETED`) while outstanding was 4; fix makes display consistent.

**Regression validation script:** `web/test-batch-logic.ts` — runs against an isolated clone of `simulation.db`; does not touch runtime databases.

### Verification evidence

| Level | Evidence |
|---|---|
| `CODE VERIFIED` | All changes reviewed against business rules |
| `BUILD VERIFIED` | `npx tsc --noEmit` clean; `npx next build` passes all 14 routes |
| `AUTOMATED TESTED` | 17/17 assertions: Batch A (send → partial → full return), Batch B (independence, wrong-batch rejection, partial return), hardware batch `LB-HW-99` with no `LB-DEMO-001` dependency |
| `BROWSER VERIFIED` | Hardware mode: `LB-HW-1` Sent 9, Returned 5, Outstanding 4, Status **In Progress**; Reconciliation: Active Batches 1, Total Sent 9, Total Returned 5, Total Outstanding 4; no `LB-DEMO-001` in any hardware response; Simulation empty state confirmed; database isolation confirmed |
| `DEVICE VERIFIED` | Chainway C5 with real RFID tags in Hardware Mode |
| `PHYSICALLY VERIFIED` | Two independent batches validated. Dynamic SEND creation passed. Partial return kept In Progress. Wrong-batch return rejected with `WRONG_BATCH`. Repeated return rejected with `ALREADY_RETURNED`. Correct returns affected only the submitted batch. Full return produced Outstanding 0 and Completed status. Completed batches disappeared from Reconciliation. Empty state confirmed after all returns. Physical execution covered equivalent acceptance criteria without following the proposed script step-by-step. Evidence file: `Testing fitur demo rfid.docx`. No deployment verification claimed. |

### Milestone status: CLOSED

## Required Business Rules (for next agent reference)

* Every submitted batch code is independent.
* `SEND_TO_LAUNDRY` safely find-or-creates the batch using the exact submitted code.
* `RETURN_FROM_LAUNDRY` resolves the exact submitted batch code.
* `acceptedSent` = count of accepted `SEND_TO_LAUNDRY` transaction items.
* `validReturned` = count of accepted `RETURN_FROM_LAUNDRY` transaction items.
* `outstanding = acceptedSent - validReturned`.
* `outstanding > 0` → In Progress.
* `outstanding = 0` and `acceptedSent > 0` → Completed.
* Reconciliation shows every active-mode batch with `outstanding > 0`.
* Laundry Batches and Reconciliation use the same shared calculation (no Set-based EPC logic).
* Simulation and Hardware databases remain isolated.
* No Prisma migration unless the schema actually changes.
* Do not commit runtime database contents.

## Next Approved Action

Dynamic Laundry Batch and Reconciliation Logic Fix milestone is fully closed. No new milestone has been approved. The next action requires Owner/Architect approval.

## Key Files

* `web/lib/services/rfid-processing.ts` — core batch and reconciliation logic
* `web/lib/services/queries.ts` — server-side data access
* `web/app/reconciliation/page.tsx` — reconciliation UI
* `web/app/laundry-batches/page.tsx` — laundry batches UI
* `web/test-batch-logic.ts` — regression validation script (untracked, not part of commit)

Android source remains unchanged.
