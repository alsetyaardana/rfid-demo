# Claude Code Instructions

## Roles

* Owner / Architect: user
* Project Manager: ChatGPT
* Executor: Claude Code, Codex, or another coding agent

Implement only the approved task. Do not invent product or architecture decisions.

## Required reading

For a new session, read only:

1. `CLAUDE.md`
2. `CURRENT_STATE.md`
3. `AGENT_HANDOFF.md`
4. Relevant source files for the current task only

Read `AGENTS.md` only when repository-wide rules are needed.

Do not reread all README and historical documents unless specifically required.

## Working method

* Repository documentation is external memory. Trust it.
* Work on one milestone only.
* Inspect the smallest relevant code path.
* Prefer targeted searches over repository-wide scans.
* Do not auto-proceed to another milestone.
* Use explicit acceptance criteria and stop conditions.
* Prevent scope drift.

## Execution rules

* Do not commit or push unless explicitly requested.
* Do not modify runtime databases or generated build artifacts.
* Do not modify Android unless the approved scope requires it.
* Do not modify the Web application, API, or database schema unless the approved scope requires it.
* Preserve Simulation and Hardware database isolation.

## Git and artifact rules

Do not commit:

* `.gradle/` directories
* `app/build/` directories
* APK files
* `.next/` cache
* Runtime databases (`simulation.db`, `hardware.db`) and WAL/SHM files
* Generated build artifacts
* Unrelated local environment files

## Evidence language

Use:

* Confirmed
* Inferred
* Not Yet Verified

Verification levels:

* CODE VERIFIED
* BUILD VERIFIED
* AUTOMATED TESTED
* BROWSER VERIFIED
* DEVICE VERIFIED
* PHYSICALLY VERIFIED
* DEPLOYMENT VERIFIED

Never equate:

* build success with workflow completion
* scripts with browser or physical verification
* ADB input with physical RFID trigger verification
* simulated payloads with physical device testing
* screenshots with independent proof of full physical workflow provenance

## Report format

Default report maximum: 10 lines.

Report only:

* Implemented
* Verified by
* Not Yet Verified
* Files changed
* Known risk
* Recommended next action

## Stop conditions

Stop immediately when:

* the approved task is complete
* evidence contradicts the requested design
* a decision from the Owner / Architect is required
* unrelated source changes are detected
* physical validation is required

## Current stable architecture

* `web/` — Next.js 14, Prisma ORM, SQLite, unified RFID HTTP API, mode-aware UI
* `android/chainway-edge-app/` — Chainway C5 E710 Android application
* Simulation Mode routes through `X-Demo-Mode: SIMULATION` → `simulation.db`
* Hardware Mode routes through `X-Demo-Mode: HARDWARE` → `hardware.db`
* Android always injects `X-Demo-Mode: HARDWARE`
* Web/API owns all validation and business logic
* `docs/screenshots/` — captured screenshot assets (web + android)
* No shared state between the two SQLite databases
