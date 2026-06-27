# Porta Nusa Hotel RFID Linen Visibility Platform

This repository contains the dual-environment solution for the Porta Nusa Hotel RFID Linen Visibility Platform, designed to seamlessly handle both simulated web demonstration and physical hardware operations.

## Purpose

The project provides a fully unified operational dashboard, database schema, and HTTP API for tracking linen lifecycle events (`STOCK_COUNT`, `SEND_TO_LAUNDRY`, `RETURN_FROM_LAUNDRY`) using RFID technology. It operates in two isolated modes to safely demonstrate capabilities without needing physical hardware, while also supporting an actual Chainway C5 Android integration.

## Operating Modes

- **Simulation Mode**: A purely browser-based demonstration. Provides robust, dynamic tools for generating mock linen inventory and triggering lifecycle scenarios using simulated RFID readings. Data is stored strictly in `simulation.db`.
- **Hardware Mode**: The physical integration environment. Connects directly to real Chainway C5 hardware scanning physical UHF tags. Features a strict 100-record limit and operational UI panels geared towards physical interactions. Data is stored strictly in `hardware.db`.

## Repository Structure

- `web/` - Next.js Website MVP, unified RFID HTTP API, Prisma/SQLite dual-client layer, tests, demo scripts, and web UI.
- `android/` - Android application (`android/chainway-edge-app/`), Chainway SDK vendor package (E710_V7.10.1), and integration documentation.

## Development Prerequisites

- Node.js & npm (for the web application)
- Android Studio / Android SDK (for the Chainway Android app)

## Setup Commands

Run these from `web/`:

```powershell
# Install dependencies
npm.cmd install

# Apply database schemas to both simulation.db and hardware.db
npm.cmd run prisma:migrate

# Start the local development server
npm.cmd run dev

# (Alternatively) Run a production build
npm.cmd run build
npm.cmd start
```

## Current Stable Status

- **Web / API**: Core HTTP API and UI are stable. Dual databases are isolated. Physical Registration panel is complete.
- **Android**: Chainway C5 SDK successfully integrated. Handheld physical scanning, real-time lists, deduplication, and HTTP uploading are stable.
- Please refer to `CURRENT_STATE.md` for the exact completed milestones.

## Known Remaining Milestones

- Web-First Physical EPC Registration (polling UI)
- RFID Read Range Profiles (NEAR, MEDIUM, FAR, CUSTOM)
- Final physical laundry acceptance
- Production deployment
