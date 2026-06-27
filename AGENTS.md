# Repository Guidance For Codex

This workspace is intentionally split by milestone surface:

- `web/` contains the Website-only MVP, unified RFID HTTP API, Prisma/SQLite database, tests, scripts, visual references, and static prototype archive.
- `android/` contains Android preparation material only, including the audited Chainway SDK vendor package and Android integration notes.
- `API_Ver20251103.rar` remains preserved unchanged at the workspace root as the original Chainway vendor archive.

Do not mix web application files into `android/`, and do not place Android implementation files into `web/`.

## Web Source Of Truth

Future Codex tasks that touch the website must treat these files as source of truth:

- Visual source of truth: `web/design-reference/DESIGN.md`
- Functional UI source of truth: `web/docs/UI_IMPLEMENTATION_NOTES.md`
- API documentation: `web/docs/RFID_API.md`

Run web commands from `web/`, for example:

```powershell
cd web
npm.cmd test
npm.cmd run build
npm.cmd run demo:reset
```

## Android Source Of Truth

Future Codex tasks that touch Android preparation must treat these files as source of truth:

- SDK audit: `android/docs/CHAINWAY_SDK_AUDIT.md`
- Integration plan: `android/docs/CHAINWAY_ANDROID_INTEGRATION_PLAN.md`
- Vendor SDK README: `android/vendor/chainway-c5/README.md`
- Copied SDK AAR: `android/vendor/chainway-c5/sdk/DeviceAPI_ver20251103_release.aar`

Do not create an Android project, import the AAR into Gradle, or start Chainway SDK integration unless explicitly requested.

## Product Direction

- Build desktop-first for the web app.
- Avoid mobile bottom navigation.
- Keep business logic outside UI components.
- Preserve original vendor/source archives.
- Never import Stitch HTML blindly if it conflicts with the final application architecture.
- Use screenshots and HTML as references, then implement reusable components in the chosen application stack.

## Development Sequence

Follow this sequence:

1. Website-only MVP
2. Unified RFID API
3. Chainway C5 Handheld Mode
4. Chainway C5 Fixed Reader Emulator
5. Event hardening
6. Real fixed reader support

Never implement a later phase unless explicitly requested.

## Design And Reference Files

- Final curated desktop references live in `web/design-reference/final-desktop/`.
- The original Stitch export must remain preserved.
- Temporary extracted Stitch source material may exist under `web/temp/stitch-extracted/` for review purposes.
- Temporary Chainway AAR inspection material may exist under `android/temp/chainway-aar-inspect/` for audit purposes.
- Do not generate new design screens during implementation unless explicitly requested.
