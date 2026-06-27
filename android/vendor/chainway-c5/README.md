# Chainway C5 Vendor SDK

This folder stores the audited Chainway Android SDK package for the future Android integration milestone.

## Layout

```text
android/vendor/chainway-c5/
  original-extracted/
    DeviceAPI_ver20251103_release.aar
    doc.rar
  docs/
    doc/
      index.html
      package-list
      com/rscja/...
  sdk/
    DeviceAPI_ver20251103_release.aar
```

## Source Archive

Original archive remains unchanged at the workspace root:

```text
API_Ver20251103.rar
```

## SDK Library

Use this copied AAR for the future Android milestone:

```text
android/vendor/chainway-c5/sdk/DeviceAPI_ver20251103_release.aar
```

Do not modify the AAR in place.

## Documentation

Vendor Javadoc is extracted at:

```text
android/vendor/chainway-c5/docs/doc/index.html
```

Audit notes:

```text
android/docs/CHAINWAY_SDK_AUDIT.md
android/docs/CHAINWAY_ANDROID_INTEGRATION_PLAN.md
```

## Current Status

SDK audit and preparation only. No Android project has been created and the AAR has not been imported into an Android app yet.
