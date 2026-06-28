# PDF Source Record — Porta Nusa Hotel RFID Documentation Package

## Generation Metadata

| Field | Value |
|---|---|
| Output filename | `porta-nusa-rfid-documentation-package.pdf` |
| Document version | 1.1 (Correction Pass) |
| Generation date | 28 June 2026 |
| Baseline commit | `72bf84d05f78e626a5cd1cc81849595d43435575` |
| Branch | `android-integration` |
| Page count | 18 |
| SHA-256 (PDF) | `509ff7675d6d603cbd8d311dbe7752ff959b3937b05bed8588b2040f8b934dc1` |
| Generator | `tmp/pdfs/generate_pdf.py` |
| Python library | reportlab 5.0.0 |

## Corrections Applied (v1.1)

1. Reconciliation caption corrected — screenshot shows partial return (1 outstanding), not empty state.
2. Dashboard caption corrected — screenshot shows Available: 1, In Laundry: 1, Outstanding: 1, Transactions: 2.
3. Linen Master caption corrected — screenshot shows two items, not three.
4. Android return caption corrected — 2 EPCs accepted, each read x14 (not 14 accepted entries).
5. Git metadata (commit hash, branch) removed from main PDF cover; retained in this source record only.
6. Developer paths (database file paths, local CLI commands) replaced with partner-safe language in main PDF.
7. Power unit label changed from "Power (dBm)" to "Configured Power Level".
8. C5 Settings screenshot captioned as local demo environment address.
9. Layout reflowed — forced page breaks removed to consolidate page count.

## Source Files

- `CLAUDE.md`
- `CURRENT_STATE.md`
- `AGENT_HANDOFF.md`
- `docs/screenshots/SCREENSHOT_MANIFEST.md`
- `web/app/guides/system-overview/page.tsx`
- `web/app/guides/simulation/page.tsx`
- `web/app/guides/hardware/page.tsx`
- `web/app/guides/operator-checklist/page.tsx`

## Screenshots Used (16 files)

- `web/web_00_landing_mode_selection.png` — Web Platform — Mode Selection Landing Page. The operator chooses Simulation or Hardware Mo...
- `web/web_01_hw_dashboard.png` — Hardware Mode Dashboard — partial return state. Available: 1, In Laundry: 1, Outstanding: ...
- `web/web_02_hw_linen_master.png` — Hardware Mode — Linen Master. Two registered linen items (IDs A and B), both showing Avail...
- `web/web_03_hw_laundry_batches.png` — Hardware Mode — Laundry Batches. Batch LB-HW-2: Sent 2, Returned 1, Outstanding 1, Status:...
- `web/web_04_hw_reconciliation.png` — Hardware Mode — Reconciliation after a partial return. Batch LB-HW-2 remains In Progress: ...
- `web/web_05_hw_transaction_history.png` — Hardware Mode — Device Activity. 7 reader sessions received; 11 unique tags. (File was lab...
- `web/web_07_hw_rfid_scan.png` — Hardware Mode — RFID Hardware Activity (RFID Scan page). Last transaction: RETURN_FROM_LAU...
- `web/web_08_sim_dashboard.png` — Simulation Mode Dashboard showing the Simulation Data Management section (Generate Demo Da...
- `web/web_09_sim_rfid_scan.png` — Simulation Mode — RFID Scan Page. Read-only view of the latest recorded session data. No l...
- `android/c5_transaction_dropdown.png` — Chainway C5 — Workflow Selection Dropdown showing STOCK_COUNT, SEND_TO_LAUNDRY, and RETURN...
- `android/c5_new_session.png` — Chainway C5 — New Session ready state. Ready to begin scanning....
- `android/c5_stock_count_scanning.png` — Chainway C5 — Live STOCK_COUNT scan in progress. Reads: 77, Unique EPCs: 2....
- `android/c5_stock_count_result.png` — Chainway C5 — STOCK_COUNT stopped. RETRY UPLOAD shown; operator can retry if the initial u...
- `android/c5_stock_count_accepted.png` — Chainway C5 — STOCK_COUNT result after upload. Accepted: 2; both EPCs show ACCEPTED....
- `android/c5_return_from_laundry_accepted.png` — Chainway C5 — RETURN_FROM_LAUNDRY accepted result. Two EPCs were accepted; each EPC was re...
- `android/c5_settings.png` — Chainway C5 — Settings Panel. Server URL shown is a local demo environment address; it mus...

## Screenshots Omitted (6 files)

- `android/c5_main_idle.png` — Redundant with c5_new_session.png
- `web/web_06_hw_device_activity.png` — REJECTED — file contains a screenshot of an editor/terminal environment, not the web application UI
- `web/web_10_guide_system_overview.png` — In-app guide; content reproduced in this PDF
- `web/web_11_guide_simulation.png` — In-app guide; content reproduced in this PDF
- `web/web_12_guide_hardware.png` — In-app guide; content reproduced in this PDF
- `web/web_13_guide_operator_checklist.png` — In-app guide; checklist reproduced in this PDF

## Evidence Boundaries

- `PHYSICALLY VERIFIED` is the highest claimed level for core RFID workflows.
- `DEPLOYMENT VERIFIED` is NOT claimed. No production deployment has been performed.
- Screenshots reflect demo data from a local development environment at time of capture.
- `web_05_hw_transaction_history.png` was mislabelled at original capture (file shows Device Activity page).
- `web_06_hw_device_activity.png` rejected — contains editor/terminal tooling screenshot.
- Server address `10.10.101.45` in C5 Settings screenshot is a local demo environment address.

## PDF Section Map

| Section | Title |
|---|---|
| 1 | Executive Summary |
| 2 | Solution Architecture |
| 3 | Operating Modes and Database Isolation |
| 4 | End-to-End Hardware Workflow |
| 5 | Web Platform — Key Screens |
| 6 | Chainway C5 Operation |
| 7 | RFID Power Profiles |
| 8 | Simulation Mode User Guide |
| 9 | Hardware Mode User Guide |
| 10 | Demo Operator Checklist |
| 11 | Troubleshooting |
| 12 | Verification Matrix |
| 13 | Known Limitations |
