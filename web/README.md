# Hotel RFID Operations Platform Web

This folder contains the Next.js application, the unified RFID HTTP API, and the dual Prisma/SQLite data layer.

## Source Of Truth

- Visual direction: `design-reference/DESIGN.md`
- Functional UI requirements: `docs/UI_IMPLEMENTATION_NOTES.md`
- API contract: `docs/RFID_API.md`

## Architecture: Dual Databases

The Web application securely manages two isolated databases:
- `simulation.db`: Contains generated mock data for browser-only demonstrations.
- `hardware.db`: Contains actual data from physical hardware scans.

**Important Data-Safety Rules**:
- The application shares a single Prisma codebase, but strict middleware isolates the two environments.
- Do NOT mix data. Do not manually transfer files between `hardware.db` and `simulation.db`.
- Simulation UI actions (such as generating data or running scenarios) operate exclusively on `simulation.db`.

### Mode Routing (X-Demo-Mode)

The active mode is determined entirely by the user's browser selection.
1. The user selects a mode on the root Welcome screen.
2. The selection is stored in `localStorage` and a secure cookie.
3. Next.js `middleware.ts` intercepts all requests and attaches the `X-Demo-Mode` header (either `SIMULATION` or `HARDWARE`).
4. If missing, the fallback mode is safely defaulted to `SIMULATION`.
5. `lib/db.ts` reads the `X-Demo-Mode` header to dynamically serve the correct Prisma client (`prismaSimulation` vs `prismaHardware`).

## Web Features

- **Mode-Aware Operational UI**: Routes cleanly differentiate between Hardware and Simulation context. Hardware Mode hides simulator controls and instead displays dynamic panels featuring actual Chainway API Status and recent activity.
- **Simulation Data Management**: Robust, explicit data management forms allow users to generate, clear, or reset simulation data (up to 100 records) without automated seeding.
- **Hardware EPC Registration Panel**: A specialized panel in `/linen-master` for Hardware Mode that surfaces recently scanned unknown physical EPCs, allowing operators to quickly register them into `hardware.db`.

## Commands

Run from this `web/` folder:

```powershell
# Install dependencies
npm.cmd install

# Build and Test
npm.cmd run build
npm.cmd test

# Run database migrations for both simulation.db and hardware.db
npm.cmd run prisma:migrate

# Reset simulation.db data
npm.cmd run demo:reset

# Initialize the Hardware database baseline only
npm.cmd run hardware:init

# Back up the Hardware database only
npm.cmd run hardware:backup

# Reset the Hardware database only
npm.cmd run hardware:reset

# Verify the Hardware database baseline only
npm.cmd run hardware:verify
```

## Hardware Database CLI

Use the Hardware database CLI workflow for `web/prisma/hardware.db` only.

- `npm.cmd run hardware:init` upserts the canonical Hardware locations without creating operational data.
- `npm.cmd run hardware:backup` writes a timestamped backup under `web/prisma/backups/hardware/`.
- `npm.cmd run hardware:reset` backs up `hardware.db`, deletes only Hardware DB files, applies Prisma migrations to `file:./hardware.db`, initializes the canonical locations, and verifies the clean baseline.
- `npm.cmd run hardware:verify` reports the Hardware path, canonical locations, and baseline counts without mutating the database.

Stop the dev server before `hardware:reset` so SQLite is not locked. Do not use `npm.cmd run prisma:migrate` for Hardware-only reset work because it migrates both databases.

Local server:

```powershell
npm.cmd run dev
```

## Main Routes

- `/` - Mode-aware Dashboard
- `/rfid-scan` - Device Activity and simulated scans
- `/linen-master` - Read-only inventory list and Hardware EPC Registration form
- `/laundry-batches` - Mode-aware operational lists
- `/reconciliation`
- `/device-activity`
- `/transaction-history`
- `/asset-management`

## Phase Boundary

This folder owns the website, API, data model, tests, and demo workflow. Do not place Android project files here.
