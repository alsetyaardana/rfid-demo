# Screenshot Manifest — Porta Nusa Hotel RFID Linen Visibility Platform

Captured: 28 June 2026
Branch: `android-integration`
Total files: 22 PNG (14 Web, 8 Android)

---

## Web Screenshots (14 files)

Captured via Chrome MCP browser navigation from `http://localhost:3000` in Hardware Mode then Simulation Mode.
Environment: Windows 11, Chrome, Next.js dev server. Data reflects environment-specific demo state at time of capture.

| File | Page / URL | Mode | Notes |
|---|---|---|---|
| `web/web_00_landing_mode_selection.png` | `/` — Landing page | — | Mode selection cards; Documentation section links visible |
| `web/web_01_hw_dashboard.png` | `/` — Dashboard | Hardware | Available: 3, In Laundry: 0, Transactions: 4, Outstanding: 0 |
| `web/web_02_hw_linen_master.png` | `/linen-master` | Hardware | 3 registered linen items |
| `web/web_03_hw_laundry_batches.png` | `/laundry-batches` | Hardware | Batch LB-HW-2 visible |
| `web/web_04_hw_reconciliation.png` | `/reconciliation` | Hardware | Outstanding 0, empty state |
| `web/web_05_hw_transaction_history.png` | `/transaction-history` | Hardware | TXN-10002, TXN-10003, TXN-10004 |
| `web/web_06_hw_device_activity.png` | `/device-activity` | Hardware | Reader activity log |
| `web/web_07_hw_rfid_scan.png` | `/rfid-scan` | Hardware | RFID Scan page, idle state |
| `web/web_08_sim_dashboard.png` | `/` — Dashboard | Simulation | Simulation Data Management is the canonical location for Generate, Clear, and Reset actions |
| `web/web_09_sim_rfid_scan.png` | `/rfid-scan` | Simulation | Read-only latest session visibility page; no live browser scan controls |
| `web/web_10_guide_system_overview.png` | `/guides/system-overview` | — | Technical Documentation guide, top of page |
| `web/web_11_guide_simulation.png` | `/guides/simulation` | — | Simulation Mode User Guide, updated for Dashboard-first data management and read-only scan visibility |
| `web/web_12_guide_hardware.png` | `/guides/hardware` | — | Hardware Mode User Guide, top of page |
| `web/web_13_guide_operator_checklist.png` | `/guides/operator-checklist` | — | Demo Operator Checklist, updated for Dashboard-first Simulation flow |

---

## Android Screenshots (8 files)

Captured via ADB screencap from Chainway C5 `636e8268`.
APK: `app-debug.apk`, build date 28 Jun 2026. Physical RFID tags: EPC `E28011B0A5050075AF741DE6` (Tag A) and `E28011B0A5050075AF741DE9` (Tag B).

| File | Description |
|---|---|
| `android/c5_main_idle.png` | C5 main screen, idle before starting a session |
| `android/c5_new_session.png` | C5 new session panel open |
| `android/c5_transaction_dropdown.png` | Workflow type dropdown showing STOCK_COUNT, SEND_TO_LAUNDRY, RETURN_FROM_LAUNDRY |
| `android/c5_settings.png` | Settings panel: Server URL `http://10.10.101.45:3000`, Reader ID, Batch Code, Power: Near |
| `android/c5_stock_count_scanning.png` | Live STOCK_COUNT scan in progress: Reads 77, Unique 2 |
| `android/c5_stock_count_result.png` | STOCK_COUNT scan stopped, RETRY UPLOAD shown |
| `android/c5_stock_count_accepted.png` | After RETRY UPLOAD: Accepted 2, both EPCs ACCEPTED |
| `android/c5_return_from_laundry_accepted.png` | RETURN_FROM_LAUNDRY result: 14 ACCEPTED entries, both Tag A and Tag B |

---

## Optional Assets Not Captured

These two screenshots were not captured and are not required for the PDF Documentation Package milestone.

| Asset | Reason not captured |
|---|---|
| C5 SEND_TO_LAUNDRY accepted-result | Would require creating a new laundry batch; deferred to avoid risky Hardware Mode state mutation |
| C5 WRONG_BATCH rejection | Would require a deliberate wrong-batch workflow; deferred as optional cosmetic asset |

---

## Notes

* Screenshots show demo data at the time of capture and are not real hotel operational data.
* Screenshots do not independently constitute proof of full physical workflow provenance.
* Server IP `10.10.101.45` visible in `c5_settings.png` — not a credential; operator-configurable field.
* The duplicate file `web/web_landing_mode_selection.png` (272 KB) was deleted; the canonical file is `web/web_00_landing_mode_selection.png` (278 KB).
