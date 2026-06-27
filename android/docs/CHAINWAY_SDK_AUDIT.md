# Chainway Android SDK Audit

Audit date: 2026-06-28

Source archive: `API_Ver20251103.rar`

## Scope

This document details the SDK extraction and analysis that laid the groundwork for the successful Chainway C5 integration. The actual Android application (`chainway-edge-app`) has now been built using these findings.

## Preservation And Extraction

| Finding | Classification |
| --- | --- |
| Original archive preserved at repository root: `API_Ver20251103.rar`. | Confirmed by AAR inspection |
| Main archive extracted to `android/vendor/chainway-c5/original-extracted/`. | Confirmed by AAR inspection |
| Nested `doc.rar` extracted to `android/vendor/chainway-c5/docs/`. | Confirmed by vendor documentation |
| AAR copied to `android/vendor/chainway-c5/sdk/DeviceAPI_ver20251103_release.aar`. | Confirmed by AAR inspection |

## Files Discovered

Main archive contents:

| File | Size | Classification |
| --- | ---: | --- |
| `DeviceAPI_ver20251103_release.aar` | 3,229,675 bytes | Confirmed by AAR inspection |
| `doc.rar` | 3,377,612 bytes | Confirmed by vendor documentation |

Extracted documentation contains Javadoc-style HTML under `android/vendor/chainway-c5/docs/doc/`.

No sample app source, demo APK, Gradle files, extra JAR files, or extra AAR files were found in the package.

## SDK Version

| Item | Value | Classification |
| --- | --- | --- |
| AAR filename | `DeviceAPI_ver20251103_release.aar` | Confirmed by AAR inspection |
| Vendor package date/version implied by filename | `20251103` | Inferred |
| Android manifest package | `com.rscja.deviceapi` | Confirmed by AAR inspection |
| Android manifest `versionCode` | `1` | Confirmed by AAR inspection |
| Android manifest `versionName` | `1.0` | Confirmed by AAR inspection |

## Package Names

Javadoc package list includes:

- `com.rscja`
- `com.rscja.barcode`
- `com.rscja.custom`
- `com.rscja.custom.interfaces`
- `com.rscja.deviceapi`
- `com.rscja.deviceapi.entity`
- `com.rscja.deviceapi.enums`
- `com.rscja.deviceapi.exception`
- `com.rscja.deviceapi.interfaces`
- `com.rscja.scanner`
- `com.rscja.system`
- `com.rscja.team.mtk.*`
- `com.rscja.team.qcom.*`
- `com.rscja.utility`

Classification: Confirmed by vendor documentation.

The AAR `classes.jar` contains 438 top-level class files across 49 package names, with 103 class names matching RFID/UHF/reader/inventory/tag keywords.

Classification: Confirmed by AAR inspection.

## Important Public Classes

Primary RFID/UHF classes found:

| Class | Notes | Classification |
| --- | --- | --- |
| `com.rscja.deviceapi.RFIDWithUHFUART` | Main handheld-style UHF API candidate. Supports singleton access, init/free, inventory, callbacks, power, frequency, EPC/TID modes, location, and fast inventory. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.RFIDWithUHFUSB` | USB UHF reader API. Supports USB device list, key callback, inventory, power, barcode helpers, and LED helpers. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.RFIDWithUHFA4` | Multi-antenna/fixed reader style API candidate. Supports inventory callbacks, ANT state, IO outputs, buzzer/LED. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.RFIDWithUHFA8` | Multi-antenna/fixed reader style API candidate. Supports inventory callbacks, ANT state, IO outputs, buzzer/LED. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.RFIDWithUHFAxBase` | Base for multi-antenna UHF APIs. Includes antenna power methods. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.RFIDWithUHFBLE` | BLE UHF reader API. Includes RSSI support toggles and callback-related classes. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.UhfBase` | Shared base for UHF APIs. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.entity.UHFTAGInfo` | EPC/RSSI/antenna/read count/tag metadata entity. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.entity.InventoryParameter` | Inventory parameter object. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.entity.InventoryModeEntity` | EPC/TID/User mode configuration object. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.entity.AntennaPowerEntity` | Antenna power entity for multi-antenna APIs. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.interfaces.IUHFInventoryCallback` | Inventory callback interface. | Confirmed by AAR inspection |
| `com.rscja.deviceapi.interfaces.KeyEventCallback` | Trigger/key callback interface. | Confirmed by AAR inspection |

## RFID Methods Identified

### Initialization And Cleanup

| Method | Class/interface | Classification |
| --- | --- | --- |
| `getInstance()` | `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFA4`, `RFIDWithUHFA8`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |
| `init(Context)` | `IUHF`, `UhfBase`, concrete RFID classes | Confirmed by AAR inspection |
| `init(UsbDevice, Context)` | `RFIDWithUHFUSB` | Confirmed by AAR inspection |
| `free()` | `IUHF`, `UhfBase`, concrete RFID classes | Confirmed by AAR inspection |
| `getConnectStatus()` | `IUHF`, `RFIDWithUHFUART`, `RFIDWithUHFUSB` | Confirmed by AAR inspection |
| `setConnectionStatusCallback(...)` | `IUHF`, `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |

### Inventory Start/Stop

| Method | Class/interface | Classification |
| --- | --- | --- |
| `startInventoryTag()` | `IUHF`, `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFA4`, `RFIDWithUHFA8`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |
| `startInventoryTag(InventoryParameter)` | `RFIDWithUHFUART`, `RFIDWithUHFBLE`, `IUHFURx` | Confirmed by AAR inspection |
| `stopInventory()` | `IUHF`, `UhfBase`, concrete RFID classes | Confirmed by AAR inspection |
| `isInventorying()` | `UhfBase`, `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |
| `inventorySingleTag()` | `IUHF`, `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |
| `inventorySingleTag(InventoryParameter)` | `RFIDWithUHFUART`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |
| `readTagFromBuffer()` | `IUHF`, `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |
| `readTagFromBufferList()` | `RFIDWithUHFUSB`, `RFIDWithUHFBLE` | Confirmed by AAR inspection |

### EPC Callback / Listener Structure

| API | Shape | Classification |
| --- | --- | --- |
| `setInventoryCallback(IUHFInventoryCallback)` | Registers callback on RFID classes. | Confirmed by AAR inspection |
| `IUHFInventoryCallback.callback(UHFTAGInfo)` | Callback receives one `UHFTAGInfo`. | Confirmed by AAR inspection |
| `UHFTAGInfo.getEPC()` | EPC string getter. | Confirmed by AAR inspection |
| `UHFTAGInfo.getCount()` | Read count getter. | Confirmed by AAR inspection |
| `UHFTAGInfo.getTimestamp()` | Timestamp getter. | Confirmed by AAR inspection |

### RSSI Availability

| API | Notes | Classification |
| --- | --- | --- |
| `UHFTAGInfo.getRssi()` / `setRssi(String)` | RSSI exists on tag result entity. | Confirmed by AAR inspection |
| `RFIDWithUHFBLE.setSupportRssi(boolean)` / `isSupportRssi()` | BLE-specific RSSI support toggle. | Confirmed by AAR inspection |
| `RFIDWithUHFBLE.RssiEntity.getRssi()` | BLE RSSI entity exposes integer RSSI. | Confirmed by AAR inspection |
| Whether C5 internal UHF always reports RSSI during inventory | Must be verified on hardware. | Requires physical Chainway C5 testing |

### Trigger Key Support

| API | Notes | Classification |
| --- | --- | --- |
| `KeyEventCallback.onKeyDown(int)` / `onKeyUp(int)` | Trigger/key callback interface exists. | Confirmed by AAR inspection |
| `RFIDWithUHFUSB.setKeyEventCallback(KeyEventCallback)` | USB reader exposes key callback registration. | Confirmed by AAR inspection |
| Trigger-key API for `RFIDWithUHFUART` on Chainway C5 | Android key events natively capture the hardware triggers. | Confirmed: Keycode 139 and 280 mapped to triggers |

### Power Configuration

| API | Notes | Classification |
| --- | --- | --- |
| `getPower()` / `setPower(int)` | Available on `RFIDWithUHFUART`, `RFIDWithUHFUSB`, `RFIDWithUHFBLE`. | Confirmed by AAR inspection |
| `setAntennaPower(AntennaEnum, int)` / `getAntennaPower(...)` | Available on `RFIDWithUHFAxBase`. | Confirmed by AAR inspection |
| `AntennaPowerEntity.getPower()` / `setPower(int)` | Entity available for antenna power values. | Confirmed by AAR inspection |
| Supported valid power range for C5 | Not stated in inspected AAR public signatures. | Requires physical Chainway C5 testing |

### Continuous Inventory Support

| API | Notes | Classification |
| --- | --- | --- |
| `startInventoryTag()` and `stopInventory()` pair | Indicates continuous inventory workflow. | Confirmed by AAR inspection |
| `setInventoryCallback(...)` | Supports callback-driven inventory. | Confirmed by AAR inspection |
| `setFastInventoryMode(FastInventoryEntity)` / `getFastInventoryMode()` | Available on `IUHF`, `UhfBase`, and concrete classes. | Confirmed by AAR inspection |
| `FastInventoryEntity(int cr)` | Fast inventory configuration entity. | Confirmed by AAR inspection |

### Release / Cleanup

| API | Notes | Classification |
| --- | --- | --- |
| `stopInventory()` | Stop active inventory before leaving screen/session. | Confirmed by AAR inspection |
| `free()` | Release API/device resources. | Confirmed by AAR inspection |
| `stopLocation()` / `stopRadarLocation()` | Available for location/radar workflows. | Confirmed by AAR inspection |

## Android Manifest And Permissions

Library manifest:

```xml
<manifest package="com.rscja.deviceapi" android:versionCode="1" android:versionName="1.0">
  <uses-sdk android:minSdkVersion="17" android:targetSdkVersion="30" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.BLUETOOTH" />
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
  <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
</manifest>
```

Classification: Confirmed by AAR inspection.

USB device filter:

```xml
<usb-device vendor-id="8263" product-id="769" />
```

Classification: Confirmed by AAR inspection.

For the future Android app, internet access will be required to send sessions to the existing HTTP API. The AAR does not declare `android.permission.INTERNET`.

Classification: Inferred.

Android 12+ Bluetooth permission behavior is not covered by the library manifest because the target SDK is 30. If the app targets Android 12 or newer and uses BLE APIs, `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` may be required.

Classification: Inferred.

## Native Libraries And ABIs

| ABI | Libraries | Classification |
| --- | --- | --- |
| `armeabi` | `libDeviceAPIM.so`, `libDeviceAPIQ.so` | Confirmed by AAR inspection |
| `armeabi-v7a` | `libDeviceAPIM.so`, `libDeviceAPIQ.so`, `libIDFingerprintAlg.so` | Confirmed by AAR inspection |
| `arm64-v8a` | `libDeviceAPIM.so`, `libDeviceAPIQ.so`, `libIDFingerprintAlg.so` | Confirmed by AAR inspection |

No `x86` or `x86_64` native libraries were present.

Classification: Confirmed by AAR inspection.

## Minimum / Target SDK And Gradle Expectations

| Item | Finding | Classification |
| --- | --- | --- |
| Minimum Android SDK | 17 | Confirmed by AAR inspection |
| Target SDK in library manifest | 30 | Confirmed by AAR inspection |
| AAR metadata | `aarFormatVersion=1.0`, `aarMetadataVersion=1.0` | Confirmed by AAR inspection |
| Compile SDK requirement | Not present in `aar-metadata.properties`. | Confirmed by AAR inspection |
| Gradle integration | Add AAR as a local file dependency in a future Android app; do not import yet. | Inferred |
| Additional JAR/AAR dependencies | None found in package or AAR. | Confirmed by AAR inspection |

## ProGuard / R8

No consumer ProGuard/R8 rules were found in the AAR.

Classification: Confirmed by AAR inspection.

Recommended future Android milestone should start without minification for first hardware validation, then add keep rules only if R8 reports missing/reflection-related SDK classes.

Classification: Inferred.

## Sample Code / Demo Application Source

No Java/Kotlin source samples, Android project, Gradle files, or demo APK were found in `API_Ver20251103.rar` or extracted `doc.rar`.

Classification: Confirmed by AAR inspection.

Javadoc HTML is present and should be treated as vendor documentation for API signatures and package/class navigation.

Classification: Confirmed by vendor documentation.

## Chainway C5 Usability Assessment

The SDK has been successfully integrated and validated on the Chainway C5.

- Handheld-style UHF class used: `RFIDWithUHFUART`.
- Standard lifecycle confirmed: `getInstance()`, `init()`, `stopInventory()`, `free()`.
- Continuous inventory confirmed: `startInventoryTag()` and `setInventoryCallback(IUHFInventoryCallback)`.
- EPC and RSSI entity confirmed: `UHFTAGInfo.getEPC()`, `getRssi()`.
- Native ARM libraries: Validated via successful build.

Hardware-specific behavior confirmed via physical Chainway C5 testing:

- E710 module integrated correctly via `RFIDWithUHFUART`.
- Android key events intercept the trigger reliably (keycodes 139 and 280).
- Inventory callback mode `IUHFInventoryCallback` runs reliably and handles deduplication gracefully.
- Repeated scanning flows (start/stop) are stable without requiring module reboot.
- Power ranges will be mapped to profiles (`NEAR`, `MEDIUM`, `FAR`, `CUSTOM`) in the upcoming milestone.
