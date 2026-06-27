# Hotel RFID Operations Platform Web

This folder contains the Website-only MVP and unified RFID HTTP API.

## Source Of Truth

- Visual direction: `design-reference/DESIGN.md`
- Functional UI requirements: `docs/UI_IMPLEMENTATION_NOTES.md`
- API contract: `docs/RFID_API.md`
- Static prototype snapshot: `prototype/static-demo/`

## Commands

Run from this `web/` folder:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run demo:reset
npm.cmd run demo:scenario
npm.cmd run mock:rfid -- fixed-send-8
```

Local server:

```powershell
npm.cmd run build
npm.cmd start
```

## Included Routes

- `/`
- `/rfid-scan`
- `/linen-master`
- `/laundry-batches`
- `/reconciliation`
- `/device-activity`
- `/transaction-history`
- `/asset-management`

## Phase Boundary

This folder owns the website, API, data model, tests, and demo workflow. Do not place Android project files here.
