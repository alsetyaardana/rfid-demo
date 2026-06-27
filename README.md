# RFID Demo Workspace

This workspace is split into separate surfaces so web/API work and Android preparation do not get mixed.

## Folders

- `web/` - Next.js Website MVP, unified RFID HTTP API, Prisma/SQLite data layer, tests, demo scripts, visual references, and static prototype.
- `android/` - Chainway C5 SDK audit, vendor AAR staging, and Android integration planning. No Android app has been created yet.

The original Chainway vendor archive remains unchanged at:

```text
API_Ver20251103.rar
```

## Web Commands

Run these from `web/`:

```powershell
cd web
npm.cmd test
npm.cmd run build
npm.cmd run demo:reset
npm.cmd run mock:rfid -- fixed-send-8
```

Local production server from `web/`:

```powershell
npm.cmd run build
npm.cmd start
```

## Android Status

Current Android work is audit/preparation only:

- `android/docs/CHAINWAY_SDK_AUDIT.md`
- `android/docs/CHAINWAY_ANDROID_INTEGRATION_PLAN.md`
- `android/vendor/chainway-c5/README.md`

Recommended next Android task: build a blank Android app and send a dummy RFID session to the existing web API before importing the Chainway AAR.
