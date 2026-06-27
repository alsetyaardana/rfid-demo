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
* **Branding**: Full transition to "Porta Nusa Hotel" and "Porta Nusa Operator" branding.

## Current Architecture

* **Simulation Browser** → sends `X-Demo-Mode: SIMULATION` via middleware → writes to `simulation.db`
* **Hardware Browser** → sends `X-Demo-Mode: HARDWARE` via middleware → reads/writes to `hardware.db`
* **Chainway C5 Android** → always injects `X-Demo-Mode: HARDWARE` headers → reads/writes to `hardware.db`

*Note: There is absolutely no shared state between the two SQLite databases. `hardware.db` starts empty and strictly limits linen creation to 100 items.*

## Next Approved Flow: Web-First Physical EPC Registration

To streamline registration without over-complicating the Android app, the next milestone focuses on a **refresh-free Web UI**.

**Flow:**
1. C5 scans tag.
2. Android uploads RFID session payload.
3. Server stores `UNKNOWN_EPC` result in `hardware.db`.
4. Hardware Linen Master UI polls (every 2–3s) for recent unknown EPCs.
5. Unknown EPC automatically appears in the Web registration queue.
6. Operator registers Linen Code and Linen Type on the Web UI.
7. Server validates and saves to `hardware.db`.
8. Next hardware scan recognizes the EPC immediately.

## Later Milestones

* **RFID Read Range Profiles**: Implementing power profiles (`NEAR`, `MEDIUM`, `FAR`, `CUSTOM`).
* **Final Physical Laundry Acceptance**: Refining real-world transaction accuracy.
* **APK Download Portal**: Allowing direct download of the Android APK from the Web UI.
* **Simulation & Hardware User Guides**: Providing distinct onboarding materials for users.
* **System Overview & Production Deployment**: Getting the MVP live.
* **Event Dress Rehearsal**: Final test of the full ecosystem.
