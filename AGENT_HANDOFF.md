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

* **Repository Closure & Final Documentation Package** - Final local-demo scope milestone:
  * PDF Documentation Package: `docs/share/porta-nusa-rfid-documentation-package.pdf`
  * Solution FAQ: `docs/share/porta-nusa-solution-faq.pdf`
  * `docs/share/README.md` for partner-facing context
  * `.gitignore` corrected and extended
  * Build artifacts untracked from git index
  * `README.md` rewritten as recovery guide
  * `docs/internal/`, `tools/docs/` created

`DEPLOYMENT VERIFIED` is not claimed for any milestone.

### Git Promotion to main - CLOSED

* `android-integration` merged to `main` with `--no-ff`
* Merge commit: `c9be489` — "merge: promote stable RFID local-demo platform to main"
* Stable tag created and pushed: `v1.0-local-demo`
* `origin/main` and `origin/android-integration` both confirmed up to date
* Build verified on `main` (17 routes, no errors)
* No tracked runtime databases or build artifacts on `main`

`DEPLOYMENT VERIFIED: NOT YET VERIFIED` — production deployment to `linen.alinktech.my.id` is deferred.

### Final milestone: Repository Closure - CLOSED

What was completed:
* PDF Documentation Package approved: `docs/share/porta-nusa-rfid-documentation-package.pdf`
* Solution FAQ approved: `docs/share/porta-nusa-solution-faq.pdf`
* Repository workspace organized: `docs/share/`, `docs/internal/`, `tools/docs/` created
* `.gitignore` fixed: Android build paths corrected, simulation.db, tsconfig.tsbuildinfo, .agents/, .claude/, output/, tmp/ added
* Build artifacts untracked from git index
* `README.md` rewritten as full recovery guide
* Production deployment deferred: `DEPLOYMENT VERIFIED` not claimed

**Project closed for current local-demo scope.**

### Deferred (Owner-initiated if pursued)

* **Partner-Ready PPTX** — not yet created
* **Docker + Cloudflare deployment** (`linen.alinktech.my.id`) — manual, by Owner

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
