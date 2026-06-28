# Agent Handoff — Porta Nusa Hotel RFID Linen Visibility Platform

## Roles

* **Owner / Architect:** user
* **Project Manager:** ChatGPT
* **Executor / Auditor:** Claude Code, Codex, or another coding agent

Working method: Owner/Architect → PM approves milestone → Executor implements → Owner reviews evidence.

---

## Required Starting Procedure

Every new executor must run this before reading anything else:

```powershell
git status --short
git log -3 --oneline
```

Do not assume a clean working tree. The tree is currently not clean — see `CURRENT_STATE.md` for details.

## Repository Reading Order

1. `CLAUDE.md` — stable operating guidance
2. `CURRENT_STATE.md` — factual snapshot of architecture and completed milestones
3. `AGENT_HANDOFF.md` — this file; operational handoff and next-milestone scope
4. Only files relevant to the active milestone

---

## Current Status

### Completed milestones (all CLOSED)

* Web MVP and RFID API
* Android SDK Integration
* Handheld Workflows (STOCK_COUNT, SEND_TO_LAUNDRY, RETURN_FROM_LAUNDRY)
* Core Hardware Features (deduplication, retry, idempotency)
* Dual Database Architecture
* Mode-Aware Web UI
* Simulation Data Management
* Web-First Physical EPC Registration and Live Polling
* **Dynamic Laundry Batch and Reconciliation Logic Fix** — `CODE VERIFIED`, `BUILD VERIFIED`, `AUTOMATED TESTED` (17/17), `BROWSER VERIFIED`, `DEVICE VERIFIED`, `PHYSICALLY VERIFIED`
* **RFID Read Range & Power Control** — `CODE VERIFIED`, `BUILD VERIFIED`, `DEVICE VERIFIED`, `PHYSICALLY VERIFIED`. Commit: `c6aa6ce`
* **In-App Documentation & Demo Readiness** — four guide routes (`/guides/system-overview`, `/guides/simulation`, `/guides/hardware`, `/guides/operator-checklist`). `CODE VERIFIED`, `BUILD VERIFIED`, `BROWSER VERIFIED`
* **Screenshot Capture** — 22 PNG files (14 web, 8 Android) in `docs/screenshots/`. `BROWSER VERIFIED`, `DEVICE VERIFIED`

`DEPLOYMENT VERIFIED` is not claimed for any milestone.

### Next milestone

**PDF Documentation Package**

### Following milestone

**Partner-Ready PPTX**

### After both documentation deliverables

**Docker + Cloudflare deployment** (`linen.alinktech.my.id`) — manual, by Owner. Intentionally deferred.

---

## Next Milestone Scope: PDF Documentation Package

The executor for this milestone must:

* Use the in-app guide routes as the primary content source:
  * `/guides/system-overview`
  * `/guides/simulation`
  * `/guides/hardware`
  * `/guides/operator-checklist`
* Use `docs/screenshots/` as the asset package. Manifest: `docs/screenshots/SCREENSHOT_MANIFEST.md`
* Create a professional PDF documentation package
* Clearly distinguish Simulation Mode and Hardware Mode workflows
* Preserve verification boundaries — do not claim DEPLOYMENT VERIFIED
* Include known limitations (no deployment, no PPTX yet, two optional Android screenshots not captured)
* Do not change application source, business logic, APIs, or databases
* Do not commit or push unless explicitly instructed

### PDF prerequisites (executor must verify before generating)

* Final screenshot inventory matches the manifest (22 PNG files)
* Screenshots are readable at intended print/screen resolution
* Captions and manifest descriptions are accurate
* No credentials, IP addresses, or private information are exposed in screenshots
* Content is consistent with the current application state
* Document branding and page structure are confirmed with PM before generation

---

## Multi-Agent Coordination

* One primary executor owns file changes per session
* Audit agents are read-only unless explicitly assigned a correction
* Do not edit the same files concurrently
* Do not mutate runtime databases (`simulation.db`, `hardware.db`) during documentation generation
* Auditor findings must be classified as:
  * BLOCKER
  * CONFIRMATION NEEDED
  * RECOMMENDED
  * OUT OF SCOPE

---

## Optional Assets Not Yet Captured

* C5 SEND_TO_LAUNDRY accepted-result screenshot
* C5 `WRONG_BATCH` rejection screenshot

These are optional enhancement assets. They should not trigger risky Hardware Mode state mutation solely for cosmetic completeness. The PDF milestone can proceed without them.

---

## Key File Locations

* `web/lib/services/rfid-processing.ts` — core batch and reconciliation logic
* `web/lib/services/queries.ts` — server-side data access
* `web/components/app-shell.tsx` — sidebar navigation and mode switching
* `web/app/guides/` — four in-app documentation routes
* `android/chainway-edge-app/app/src/main/java/com/hotel/rfid/edge/MainActivity.kt` — C5 app main logic
* `docs/screenshots/` — captured screenshot assets
* `docs/screenshots/SCREENSHOT_MANIFEST.md` — screenshot inventory and captions

---

## Stop Condition

Do not start PDF generation during the documentation-update task. After all three repository documents are updated and verified for consistency, stop and report. PM reviews and approves before PDF generation begins.
