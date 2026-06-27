# RFID HTTP API

This API exposes the existing Website-only MVP RFID processing layer through a normalized HTTP contract. It is intended for local event demos and future device clients.

## Base URL

Local machine:

`http://127.0.0.1:3000`

Same local network:

`http://<host-ip>:3000`

## Required Headers

All API requests require:

```http
Content-Type: application/json
X-RFID-API-Key: local-demo-rfid-key
X-Demo-Mode: HARDWARE
```

The expected key is read from `RFID_API_KEY`. Do not expose this key in client-side browser JavaScript.

The `X-Demo-Mode` header dictates which SQLite database receives the data:
- `SIMULATION`: Writes to `simulation.db`. Used by web simulators.
- `HARDWARE`: Writes to `hardware.db`. The Android Chainway C5 always injects this mode to isolate physical tags from mock data.
If omitted, it defaults to `SIMULATION` for safety.

## Endpoints

- `POST /api/rfid/read-sessions`
- `GET /api/rfid/read-sessions/:id`

The `:id` value may be either the internal session id or the external `clientSessionId`.

## Supported Values

Reader types:

- `SIMULATOR`
- `HANDHELD`
- `FIXED_READER_EMULATOR`
- `FIXED_READER`

Operation modes:

- `SIMULATION`
- `MANUAL`
- `AUTOMATIC`

Data sources:

- `WEBSITE_SIMULATION`
- `LIVE_DEVICE`

Transaction types:

- `STOCK_COUNT`
- `SEND_TO_LAUNDRY`
- `RETURN_FROM_LAUNDRY`
- `ASSET_AUDIT`

`ASSET_AUDIT` is recognized but not implemented in the current Website-only linen MVP. It returns a validation response instead of silently processing.

## Request Schema

```json
{
  "clientSessionId": "C5-DEMO-01-20260627-001",
  "readerId": "C5-DEMO-01",
  "readerType": "HANDHELD",
  "operationMode": "MANUAL",
  "dataSource": "LIVE_DEVICE",
  "checkpoint": "LINEN_STORAGE",
  "transactionType": "SEND_TO_LAUNDRY",
  "laundryBatchCode": "LB-HW-001",
  "operatorName": "Demo Operator",
  "startedAt": "2026-06-27T10:15:00+08:00",
  "completedAt": "2026-06-27T10:15:05+08:00",
  "tags": [
    {
      "epc": "EPC30080001",
      "rssi": -48,
      "antenna": null,
      "readCount": 3,
      "firstSeenAt": "2026-06-27T10:15:01+08:00",
      "lastSeenAt": "2026-06-27T10:15:04+08:00"
    }
  ]
}
```

## Response Schema

```json
{
  "success": true,
  "idempotentReplay": false,
  "session": {
    "id": "...",
    "clientSessionId": "C5-DEMO-01-20260627-001",
    "readerId": "C5-DEMO-01",
    "readerType": "HANDHELD",
    "operationMode": "HANDHELD_OPERATION",
    "transactionType": "SEND_TO_LAUNDRY"
  },
  "summary": {
    "rawReadCount": 10,
    "uniqueEpcCount": 8,
    "registeredCount": 8,
    "unknownCount": 0,
    "acceptedCount": 8,
    "rejectedCount": 0,
    "duplicateCount": 2
  },
  "items": [
    {
      "epc": "EPC30080001",
      "linenCode": "LN-TWL-001",
      "linenType": "Bath Towel",
      "status": "ACCEPTED",
      "reason": null,
      "readCount": 3
    }
  ],
  "transaction": {
    "id": "...",
    "transactionCode": "TXN-10001",
    "transactionType": "SEND_TO_LAUNDRY"
  }
}
```

## Example Handheld Request

```json
{
  "clientSessionId": "C5-HANDHELD-SEND-001",
  "readerId": "C5-DEMO-01",
  "readerType": "HANDHELD",
  "operationMode": "MANUAL",
  "dataSource": "LIVE_DEVICE",
  "checkpoint": "LINEN_STORAGE",
  "transactionType": "SEND_TO_LAUNDRY",
  "laundryBatchCode": "LB-HW-001",
  "operatorName": "Demo Operator",
  "startedAt": "2026-06-27T10:15:00+08:00",
  "completedAt": "2026-06-27T10:15:05+08:00",
  "tags": [
    { "epc": "EPC30080001", "rssi": -48, "antenna": null, "readCount": 2 },
    { "epc": "EPC30080002", "rssi": -49, "antenna": null, "readCount": 2 }
  ]
}
```

## Example Fixed Reader Emulator Request

```json
{
  "clientSessionId": "FX-EMU-SEND-001",
  "readerId": "FX-LDY-02",
  "readerType": "FIXED_READER_EMULATOR",
  "operationMode": "AUTOMATIC",
  "dataSource": "LIVE_DEVICE",
  "checkpoint": "LAUNDRY_DISPATCH_GATE",
  "transactionType": "SEND_TO_LAUNDRY",
  "laundryBatchCode": "LB-HW-001",
  "startedAt": "2026-06-27T10:15:00+08:00",
  "completedAt": "2026-06-27T10:15:30+08:00",
  "tags": [
    { "epc": "EPC30080001", "rssi": -51, "antenna": "ANT-1", "readCount": 4 }
  ]
}
```

## Curl Examples

Send 8 linen:

```bash
curl -X POST http://127.0.0.1:3000/api/rfid/read-sessions \
  -H "Content-Type: application/json" \
  -H "X-RFID-API-Key: local-demo-rfid-key" \
  -H "X-Demo-Mode: HARDWARE" \
  -d @send-8.json
```

Fetch by client session id:

```bash
curl http://127.0.0.1:3000/api/rfid/read-sessions/C5-HANDHELD-SEND-001 \
  -H "X-RFID-API-Key: local-demo-rfid-key" \
  -H "X-Demo-Mode: HARDWARE"
```

## Error Responses

Missing or invalid API key:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid X-RFID-API-Key header."
  }
}
```

Invalid payload or unsupported business combination:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "HANDHELD readers must use MANUAL or SIMULATION operation mode."
  }
}
```

Unknown internal server failures return HTTP 500 with a safe message and log details server-side.

## Idempotency

`clientSessionId` is unique.

If the same `clientSessionId` is submitted again:

- No new `RFIDReadSession` is created.
- No new `Transaction` is created.
- The API returns the previously persisted result.
- `idempotentReplay` is `true`.

This supports mobile or fixed-reader retry behavior after network timeouts.

## Local Network Notes For Android

- Start the app with `node.exe .\node_modules\next\dist\bin\next start -H 0.0.0.0 -p 3000`.
- Find the host IP with `ipconfig`.
- Android device must be on the same Wi-Fi/VLAN or have routing to the host.
- Use `http://<host-ip>:3000/api/rfid/read-sessions`.
- If connection fails, check Windows Firewall for inbound TCP port `3000`.
- Keep `RFID_API_KEY` out of browser JavaScript; a future Android build can store a demo key in local configuration for event testing only.
