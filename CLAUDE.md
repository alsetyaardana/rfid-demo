# Claude Code Instructions

## Roles

* User: Owner / Architect
* ChatGPT: Project Manager
* Claude Code: Coding Executor

Implement only the approved task. Do not invent product or architecture decisions.

## Required reading

For a new session, read only:

1. `CURRENT_STATE.md`
2. `AGENT_HANDOFF.md`
3. Relevant source files for the current task

Read `AGENTS.md` only when repository-wide rules are needed.

Do not reread all README and historical documents unless specifically required.

## Execution rules

* Work on one milestone only.
* Inspect the smallest relevant code path.
* Prefer targeted searches over repository-wide scans.
* Do not auto-proceed to another milestone.
* Do not commit or push unless explicitly requested.
* Do not modify runtime databases or generated build artifacts.
* Do not modify Android unless the approved scope requires it.
* Preserve Simulation and Hardware database isolation.

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
