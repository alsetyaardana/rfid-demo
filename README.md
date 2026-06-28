# Porta Nusa Hotel RFID Linen Visibility Platform

A dual-environment platform for tracking hotel linen lifecycle using UHF RFID. Runs fully in-browser as a simulation, or connects a physical Chainway C5 E710 handheld scanner in hardware mode.

---

## 1. Project Overview

The platform tracks three linen lifecycle events — `STOCK_COUNT`, `SEND_TO_LAUNDRY`, and `RETURN_FROM_LAUNDRY` — via a web dashboard and an Android app on the Chainway C5 E710 RFID handheld.

**Simulation Mode** uses a browser-based workflow with generated mock data stored in `simulation.db`. No hardware is required.

**Hardware Mode** connects the physical Chainway C5 scanning real UHF RFID tags. Data is stored in `hardware.db`, completely isolated from simulation data.

The Android app always injects `X-Demo-Mode: HARDWARE`. Mode selection in the web UI is independent and does not affect Android.

**Current scope:** Local demonstration on a single Windows laptop with a C5 on the same Wi-Fi network. Production deployment to `linen.alinktech.my.id` is intentionally deferred.

---

## 2. Repository Structure

```
web/                          Next.js 14 app, Prisma ORM, SQLite, RFID HTTP API
  app/                        Next.js App Router pages and API routes
  components/                 UI components and mode panels
  app/guides/                 In-app documentation routes (system-overview, simulation, hardware, operator-checklist)
  prisma/                     Schema, migrations, and runtime databases (not committed)
  scripts/                    Hardware database maintenance scripts

android/
  chainway-edge-app/          Chainway C5 E710 Android app (Kotlin)
    app/src/main/java/        Application source
  vendor/chainway-c5/         Chainway SDK AAR and documentation (committed)
    sdk/DeviceAPI_ver20251103_release.aar

docs/
  share/                      Partner-safe deliverable PDFs
  screenshots/                Web and Android screenshot assets
  internal/                   Source records and internal working documents
  HARDWARE_DATABASE_RUNBOOK.md

tools/
  docs/                       PDF generation scripts (Python)

CURRENT_STATE.md              Single source of truth for milestone status
AGENT_HANDOFF.md              Operational handoff notes for executor agents
```

---

## 3. Prerequisites

Verified requirements for this repository:

| Component | Verified version |
|---|---|
| Node.js | v24.18.0 (LTS) |
| npm | 11.16.0 |
| Java / JDK | JDK 8 target (compileSdk 34; see `android/chainway-edge-app/app/build.gradle`) |
| Android Studio / Gradle | Gradle wrapper included (`android/chainway-edge-app/gradlew.bat`) |
| Windows PowerShell | Windows 11 |
| Chainway C5 E710 | Required for physical RFID verification only |
| Local Wi-Fi | C5 and laptop must be on the same subnet |

The Chainway SDK (`DeviceAPI_ver20251103_release.aar`) is already committed in `android/vendor/chainway-c5/sdk/`. No external SDK download is required.

---

## 4. Fresh Setup on Another Windows Laptop

### 4.1 Clone and checkout

```powershell
git clone https://github.com/alsetyaardana/rfid-demo.git "RFID Demo"
cd "RFID Demo"
git checkout android-integration
```

### 4.2 Install web dependencies

```powershell
cd web
npm.cmd install
```

### 4.3 Configure environment

```powershell
# Copy the example — edit if you need a different API key
copy .env.example .env
```

The default `.env.example` is configured for local demo use. The `RFID_API_KEY` value must match the key configured in the Android app Settings panel.

### 4.4 Initialize databases

```powershell
# Create and migrate both simulation.db and hardware.db
npm.cmd run prisma:migrate

# Initialize the hardware baseline (two storage locations)
npm.cmd run hardware:init

# Verify hardware database is healthy
npm.cmd run hardware:verify
```

### 4.5 Start the web application

```powershell
npm.cmd run dev
```

Open `http://localhost:3000` in Chrome. The landing page presents the mode selection.

### 4.6 Verify Simulation Mode

1. Click **Enter Simulation Mode**.
2. Navigate to **Dashboard → Simulation Data Management**.
3. Click **Generate Demo Data** — 20 linen items appear.
4. Dashboard shows Available count updated.

### 4.7 Configure C5 for Hardware Mode

On the Chainway C5:

1. Open the RFID Hotel app.
2. Tap **SETTINGS** (top-right gear icon).
3. Set **Server URL** to `http://<your-laptop-ip>:3000` (find IP with `ipconfig`).
4. Set **Reader ID** to a unique identifier (e.g., `C5-READER-01`).
5. Set **API Key** to the same value as `RFID_API_KEY` in `.env`.
6. Set **Read Range / Power** to the desired profile (NEAR / MEDIUM / FAR).
7. Tap **SAVE CONFIGURATION**.
8. Tap **TEST API** — confirm `{"status":"ok"}` response.

### 4.8 Build and install the Android app (when needed)

From the repository root:

```powershell
cd android/chainway-edge-app
.\gradlew.bat assembleDebug
```

APK output: `android/chainway-edge-app/app/build/outputs/apk/debug/app-debug.apk`

Install via ADB:

```powershell
adb install app\build\outputs\apk\debug\app-debug.apk
```

---

## 5. Environment Variables

The web application requires a `.env` file in `web/`. Use `.env.example` as the template:

```env
DATABASE_URL="file:./dev.db"
RFID_API_KEY="local-demo-rfid-key"
```

`DATABASE_URL` — Prisma default; the actual dual-database scripts override this at runtime.
`RFID_API_KEY` — Must match the API Key in the Android app Settings panel. Change this if you want to restrict unauthorized uploads.

**Never commit a working secret.** The `.env` file is gitignored. Only `.env.example` is tracked.

---

## 6. Database Lifecycle

Runtime databases are **not committed**. They are created locally by the migration and init scripts.

| Command | Action |
|---|---|
| `npm.cmd run prisma:migrate` | Create/migrate both `simulation.db` and `hardware.db` |
| `npm.cmd run hardware:init` | Initialize hardware baseline locations (idempotent) |
| `npm.cmd run hardware:backup` | Timestamped backup under `web/prisma/backups/hardware/` |
| `npm.cmd run hardware:reset` | Backup → delete → remigrate → reinit hardware.db only |
| `npm.cmd run hardware:verify` | Health check — exits 0 on PASS |

All commands run from `web/`.

Simulation and hardware databases are **completely isolated**. `hardware:reset` never touches `simulation.db`.

Backups are stored locally under `web/prisma/backups/` and are gitignored.

See [`docs/HARDWARE_DATABASE_RUNBOOK.md`](docs/HARDWARE_DATABASE_RUNBOOK.md) for full runbook.

---

## 7. Local Demo Startup

### Simulation demo

```powershell
cd web
npm.cmd run dev
# Open http://localhost:3000
# Select Simulation Mode
# Dashboard → Generate Demo Data
# Navigate dashboard views
```

### Hardware demo

```powershell
cd web
npm.cmd run dev
# Open http://localhost:3000
# Select Hardware Mode
# Confirm C5 Settings (Server URL, Reader ID, API Key, Power)
# On C5: select workflow → trigger scan → upload
# Browser: Dashboard updates with scan results
```

---

## 8. Recovery and Troubleshooting

**Reinstall web dependencies**

```powershell
cd web
Remove-Item -Recurse -Force node_modules
npm.cmd install
```

**Stale `.next` build cache**

```powershell
cd web
Remove-Item -Recurse -Force .next
npm.cmd run build
```

**Reinitialize hardware database from scratch**

```powershell
cd web
npm.cmd run hardware:reset
npm.cmd run hardware:verify
```

**C5 cannot reach server**
- Run `ipconfig` on laptop — use the IPv4 of the Wi-Fi adapter.
- Confirm both C5 and laptop are on the same Wi-Fi network.
- Check Windows Firewall — allow inbound on port 3000.
- Restart `npm run dev` if the server was stopped.

**API 401 / auth mismatch**
- `RFID_API_KEY` in `.env` must exactly match the API Key in C5 Settings.
- After changing `.env`, restart the dev server.

**Reader initialization failure on C5**
- Physical trigger requires the RFID module to initialize. Wait 2 seconds after app start before scanning.
- If status shows FAILED, tap Stop, then re-trigger.

**Stale APK on C5**
- Rebuild with `.\gradlew.bat assembleDebug` and reinstall via ADB.
- Old APK may not have the latest settings fields or power profile options.

**Port already in use**
- Find and stop the process: `netstat -ano | findstr :3000`
- Or change the port: `npm.cmd run dev -- --port 3001` and update C5 Server URL.

---

## 9. Verification Status

| Area | Status |
|---|---|
| Web / API code | CODE VERIFIED |
| Web build (`next build`) | BUILD VERIFIED |
| Automated API tests (17/17) | AUTOMATED TESTED |
| Web browser flows | BROWSER VERIFIED |
| Android app on C5 device | DEVICE VERIFIED |
| Physical RFID workflows | PHYSICALLY VERIFIED |
| Production deployment | NOT YET VERIFIED |

`DEPLOYMENT VERIFIED` is not claimed. Production deployment to `linen.alinktech.my.id` is intentionally deferred.

---

## 10. Documentation

**Partner-safe documents** (safe to share):

- [`docs/share/porta-nusa-rfid-documentation-package.pdf`](docs/share/porta-nusa-rfid-documentation-package.pdf) — Full technical and operational documentation
- [`docs/share/porta-nusa-solution-faq.pdf`](docs/share/porta-nusa-solution-faq.pdf) — Solution FAQ for non-technical stakeholders

**Internal documents:**

- [`docs/HARDWARE_DATABASE_RUNBOOK.md`](docs/HARDWARE_DATABASE_RUNBOOK.md) — Hardware database maintenance runbook
- [`docs/screenshots/`](docs/screenshots/) — Web and Android screenshot assets (22 PNG files)
- [`CURRENT_STATE.md`](CURRENT_STATE.md) — Milestone progress and architecture reference
- [`AGENT_HANDOFF.md`](AGENT_HANDOFF.md) — Operational handoff for executor agents

---

## 11. Git and Artifact Policy

**Never commit:**

- `web/prisma/*.db` — runtime databases
- `web/prisma/*.db-wal`, `*.db-shm` — database WAL files
- `web/prisma/backups/` — local database backups
- `web/.next/` — Next.js build cache
- `web/tsconfig.tsbuildinfo` — TypeScript incremental build state
- `web/node_modules/` — installed packages
- `android/chainway-edge-app/.gradle/` — Gradle build cache
- `android/chainway-edge-app/app/build/` — Android build output and APKs
- `web/.env` — environment file with actual keys
- `.agents/`, `.claude/` — local AI tool state
- `output/`, `tmp/` — local generation working directories
- `local-archive/` — local-only vendor archives

The `.env.example` template (no real secrets) is tracked and safe to commit.
