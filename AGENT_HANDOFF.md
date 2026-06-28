# Agent Handoff - Porta Nusa Hotel RFID Linen Visibility Platform

## Roles

* **Owner / Architect:** user
* **Project Manager:** ChatGPT
* **Executor / Auditor:** Claude Code, Codex, or another coding agent

Working method: Owner/Architect -> PM approves milestone -> Executor implements -> Owner reviews evidence.

---

## Required Starting Procedure

Every new executor must run this before reading anything else:

```powershell
git status --short
git log -3 --oneline
```

Do not assume a clean working tree. The tree is currently not clean - see `CURRENT_STATE.md` for details.

## Repository Reading Order

1. `CLAUDE.md` - stable operating guidance
2. `CURRENT_STATE.md` - factual snapshot of architecture and completed milestones
3. `AGENT_HANDOFF.md` - this file; operational handoff and next-milestone scope
4. Only files relevant to the active milestone

---

## Current Status

### Completed milestones (all CLOSED)

* Web MVP and RFID API
* Android SDK Integration
* Handheld Workflows (`STOCK_COUNT`, `SEND_TO_LAUNDRY`, `RETURN_FROM_LAUNDRY`)
* Core Hardware Features (deduplication, retry, idempotency)
* Dual Database Architecture
* Mode-Aware Web UI
* Simulation Data Management
* Web-First Physical EPC Registration and Live Polling
* **Dynamic Laundry Batch and Reconciliation Logic Fix** - `CODE VERIFIED`, `BUILD VERIFIED`, `AUTOMATED TESTED` (17/17), `BROWSER VERIFIED`, `DEVICE VERIFIED`, `PHYSICALLY VERIFIED`
* **RFID Read Range & Power Control** - `CODE VERIFIED`, `BUILD VERIFIED`, `DEVICE VERIFIED`, `PHYSICALLY VERIFIED`. Commit: `c6aa6ce`
* **In-App Documentation & Demo Readiness** - four guide routes (`/guides/system-overview`, `/guides/simulation`, `/guides/hardware`, `/guides/operator-checklist`). `CODE VERIFIED`, `BUILD VERIFIED`, `BROWSER VERIFIED`
* **Screenshot Capture** - 22 PNG files (14 web, 8 Android) in `docs/screenshots/`. `BROWSER VERIFIED`, `DEVICE VERIFIED`
* **Simulation UI Consistency & Operator Safety Fix** - Dashboard is the canonical Simulation data-action surface; Simulation RFID page is read-only; Simulation docs and selective screenshots updated. `CODE VERIFIED`, `BUILD VERIFIED`, `BROWSER VERIFIED`
* **Hardware Demo Baseline & Reset Workflow - CLI Only** - Hardware-only maintenance scripts and runbook added:
  * `npm.cmd run hardware:init`
  * `npm.cmd run hardware:backup`
  * `npm.cmd run hardware:reset`
  * `npm.cmd run hardware:verify`
  * targets `web/prisma/hardware.db` only
  * never uses the dual-database `prisma:migrate` script for reset
  * backup root: `web/prisma/backups/hardware/`
  * runbook: `docs/HARDWARE_DATABASE_RUNBOOK.md`
  * `AUTOMATED TESTED`: one-command reset completed on Windows; verifier PASS; Simulation DB unchanged before/after

`DEPLOYMENT VERIFIED` is not claimed for any milestone.

### Next milestone

**PDF Documentation Package**

### Following milestone

**Partner-Ready PPTX**

### After both documentation deliverables

**Docker + Cloudflare deployment** (`linen.alinktech.my.id`) - manual, by Owner. Intentionally deferred.

---

## Multi-Agent Coordination

* One primary executor owns file changes per session
* Audit agents are read-only unless explicitly assigned a correction
* Do not edit the same files concurrently
* Do not mutate runtime databases during documentation generation unless a later milestone explicitly requires it
* Auditor findings must be classified as:
  * BLOCKER
  * CONFIRMATION NEEDED
  * RECOMMENDED
  * OUT OF SCOPE

---

## Optional Assets Not Yet Captured

* C5 SEND_TO_LAUNDRY accepted-result screenshot
* C5 `WRONG_BATCH` rejection screenshot

These are optional enhancement assets. They should not trigger risky Hardware Mode state mutation solely for cosmetic completeness.

---

## Key File Locations

* `web/app/guides/` - in-app documentation routes used as PDF content source
* `docs/screenshots/` - screenshot asset package
* `docs/screenshots/SCREENSHOT_MANIFEST.md` - screenshot inventory and captions
* `android/chainway-edge-app/app/src/main/java/com/hotel/rfid/edge/MainActivity.kt` - C5 app main logic

---

## Stop Condition

Do not change application source, Android logic, or database behavior during the PDF documentation milestone. After the document inputs are verified and the PDF package is prepared, stop and report. PM reviews before PPTX or deployment work.
