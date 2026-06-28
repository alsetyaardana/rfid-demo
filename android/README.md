# Android Workspace

This folder contains the Chainway C5 Android application implementation and related hardware documentation for the Porta Nusa Hotel RFID Linen Visibility Platform.

## Current Contents

- `chainway-edge-app/`: The active Android Studio project (package: `com.portanusa.chainwayedge`).
- `docs/CHAINWAY_SDK_AUDIT.md`: Finalized vendor SDK audit.
- `docs/CHAINWAY_ANDROID_INTEGRATION_PLAN.md`: Finalized integration architecture plan.
- `vendor/chainway-c5/`: Staging for the original SDK and AAR (E710_V7.10.1).
- `temp/chainway-aar-inspect/`: Temporary workspace for AAR analysis.

## Android Implementation Details

### Hardware Integration
- **Module**: E710 UHF module integrated via `RFIDWithUHFUART` from the `DeviceAPI_ver20251103_release.aar`.
- **Lifecycle**: Safe `init()` and `free()` management bound to the activity lifecycle.
- **Physical Triggers**: Keycode 139 and 280 (Pistol Grip) successfully trigger scanning asynchronously.
- **Scanning**: Uses `startInventoryTag()` and `stopInventory()` via `IUHFInventoryCallback` to manage real-time EPC reads and RSSI handling.
- **Real-Time Data**: EPC lists are deduplicated instantly and buffered gracefully before HTTP upload.

### Application Workflows
- **ScanState Flow**: Strict state management (`IDLE`, `SCANNING`, `UPLOADING`) prevents race conditions.
- **Supported Transactions**: The UI drives three distinct `TransactionType` behaviors: `STOCK_COUNT`, `SEND_TO_LAUNDRY`, and `RETURN_FROM_LAUNDRY`.
- **Registration**: The Android application does **not** contain a Linen Registration Editor. Unregistered tags naturally submit as `UNKNOWN_EPC`s and are registered via the Web UI to prevent duplicated logic.

### Network and API
- **Header Injection**: Enforces `X-Demo-Mode: HARDWARE` on all API requests. Android explicitly communicates *only* with `hardware.db`.
- **Configuration**: API URL and API Key (`X-RFID-API-Key`) can be configured locally within the app settings.
- **Idempotency**: All uploads specify a unique `clientSessionId` to safely handle network retries.

## Current APK Path

The built APK (when compiled) is located at:
`android/chainway-edge-app/app/build/outputs/apk/debug/app-debug.apk`

## Planned Next Milestones

- **RFID Read Range Profiles**: Implementing power control profiles (`NEAR`, `MEDIUM`, `FAR`, `CUSTOM`) to support specific operational ranges. `NEAR` will be specifically enforced/recommended for single-tag registration workflows.
