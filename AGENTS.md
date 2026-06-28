# Repository Guidance For Codex

This workspace is intentionally split by milestone surface:

- `web/` contains the Next.js + Prisma application (Website MVP, unified RFID HTTP API, SQLite databases).
- `android/` contains the Android application (`android/chainway-edge-app/`), audited Chainway SDK vendor package, and Android integration notes.
- `API_Ver20251103.rar` remains preserved unchanged at the workspace root as the original Chainway vendor archive.

Do not mix web application files into `android/`, and do not place Android implementation files into `web/`.

## Core Architectural Rules

- **Active Development Branch**: `android-integration`
- **Dual Databases**: `simulation.db` and `hardware.db` are fully isolated.
- **Web Routing**: Browser mode selection (`X-Demo-Mode` cookie) controls the Web database routing. Both simulation and hardware UI must remain mode-aware.
- **Android Routing**: Android always sends `X-Demo-Mode: HARDWARE`.
- **Source of Truth**: `web/docs/RFID_API.md` remains the source of truth for all device-to-server communications. Business logic must remain server-side.
- **Demo Data Safety**: Do not reintroduce hardcoded demo batches (e.g. `LB-DEMO-001`) or hardcoded EPCs into the operational codebase.
- **Stability**: Do not modify completed stable flows (STOCK_COUNT, SEND_TO_LAUNDRY, RETURN_FROM_LAUNDRY) without regression tests.
- **Protected Files**: Do not casually modify Prisma schema constraints, database clients (`lib/db.ts`), middleware (`middleware.ts`), or `X-Demo-Mode` headers unless required by a specific milestone.

## Before You Change Anything (Checklist)

1. Verify which mode your changes impact (Simulation or Hardware).
2. Ensure you are not coupling Hardware UI components to Simulation logic.
3. Confirm API contract changes (if any) are reflected in `RFID_API.md`.
4. Ensure no physical tags get written to `simulation.db`.

## Commands

Run web commands from `web/`:

```powershell
# Build and Test
npm.cmd run build
npm.cmd test

# Database Migrations (applies to both DBs)
npm.cmd run prisma:migrate

# Reset Simulation
npm.cmd run demo:reset
```

## Documentation Reference

- Current State / Progress: `CURRENT_STATE.md`
- Next.js Web App: `web/README.md`
- Android App: `android/README.md`
- API Reference: `web/docs/RFID_API.md`
