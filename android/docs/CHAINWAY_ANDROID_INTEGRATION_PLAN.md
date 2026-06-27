# Chainway Android Integration Plan

**Status: COMPLETED**
This original integration plan has been fully realized. The Android application `chainway-edge-app` was successfully built and integrated according to this architecture.

## Integration Principle

The Android client must send normalized RFID read sessions to the existing web API:

- `POST /api/rfid/read-sessions`
- Header: `X-RFID-API-Key`
- Payload must match the existing normalized contract.

Do not duplicate transaction, reconciliation, laundry batch, or inventory mutation logic in Android. Android should collect reads, normalize client-side enough for clean payloads, and let the web API enforce business rules.

## Smallest First Android Milestone

1. Build a blank Android app.
2. Send a dummy RFID session to the existing web API.
3. Integrate the Chainway AAR.
4. Read a real EPC.
5. Display EPC and RSSI.
6. Submit the RFID session to the web API.
7. Add Handheld Operation.
8. Add Fixed Reader Emulator.

## Milestone Details

### 1. Blank Android App

Goal: prove local Android build environment only.

Acceptance:

- App launches on emulator or device.
- No Chainway SDK imported yet.
- No RFID logic.

### 2. Dummy Session To Web API

Goal: validate Android-to-web API connectivity before hardware risk.

Acceptance:

- App sends one hardcoded valid `STOCK_COUNT` or `SEND_TO_LAUNDRY` payload.
- API response displays success/failure in app.
- Session appears in Device Activity.
- No API key exposed in logs.

### 3. Integrate Chainway AAR

Goal: compile app with `DeviceAPI_ver20251103_release.aar`.

Planned local dependency:

```gradle
dependencies {
    implementation files("libs/DeviceAPI_ver20251103_release.aar")
}
```

Likely permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

For Android 12+ BLE use, evaluate:

```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

Acceptance:

- App compiles.
- No R8/minification for first hardware milestone.
- No website/API changes.

### 4. Read A Real EPC

Goal: prove Chainway C5 UHF access.

Primary class candidate:

```java
RFIDWithUHFUART uhf = RFIDWithUHFUART.getInstance();
boolean ok = uhf.init(context);
```

Candidate inventory paths:

```java
uhf.setInventoryCallback(tagInfo -> {
    String epc = tagInfo.getEPC();
    String rssi = tagInfo.getRssi();
});
uhf.startInventoryTag();
uhf.stopInventory();
uhf.free();
```

or polling:

```java
uhf.startInventoryTag();
UHFTAGInfo tag = uhf.readTagFromBuffer();
uhf.stopInventory();
```

Acceptance:

- One real EPC appears on screen.
- App can stop inventory cleanly.
- App can release SDK resources cleanly.

### 5. Display EPC And RSSI

Goal: verify useful read data for the HTTP payload.

Use:

- `UHFTAGInfo.getEPC()`
- `UHFTAGInfo.getRssi()`
- `UHFTAGInfo.getCount()`
- `UHFTAGInfo.getAnt()`
- `UHFTAGInfo.getTimestamp()`

Acceptance:

- EPC visible.
- RSSI visible if the C5 module reports it.
- Missing/blank RSSI is handled safely.

### 6. Submit RFID Session To Web API

Goal: bridge real hardware reads into existing server-side processing.

Use request values:

- `readerType = HANDHELD`
- `operationMode = MANUAL`
- `dataSource = LIVE_DEVICE`
- `clientSessionId` generated once per scan attempt and reused on retry.

Acceptance:

- Device-created session appears in Device Activity.
- Transaction appears in Transaction History when applicable.
- Reconciliation updates through existing API behavior.
- Retry with the same `clientSessionId` returns idempotent replay.

### 7. Add Handheld Operation

Goal: production-like handheld send/return flow.

Acceptance:

- Operator can choose transaction type.
- Operator can start/stop scan.
- Duplicate reads collapse server-side.
- Unknown EPC and rejected reasons are displayed clearly from API response.

### 8. Add Fixed Reader Emulator

Goal: emulate fixed reader behavior from Android only after handheld path is proven.

Acceptance:

- `readerType = FIXED_READER_EMULATOR`
- `operationMode = AUTOMATIC`
- Session uploads automatically after timer/batch window.
- No manual confirmation as primary flow.

## Technical Resolutions

- The exact module integrated successfully was E710 via `RFIDWithUHFUART`.
- Trigger keys (139, 280) were successfully intercepted via standard Android `onKeyDown` without vendor services.
- Native `IUHFInventoryCallback` was utilized successfully for deduplicated polling.
- The `X-Demo-Mode: HARDWARE` header ensures API isolation.
- Upcoming focus: mapping valid power ranges to Profiles (NEAR, MEDIUM, FAR).

## Stop Conditions (Resolved)

The initial integration risk was resolved successfully:
- `init()` succeeded.
- EPCs scan stably.

- `init(Context)` fails on the physical C5.
- No EPC can be read from known tags.
- RSSI is absent and operational UI requires RSSI as mandatory.
- The SDK requires undocumented dependencies not included in the vendor package.

