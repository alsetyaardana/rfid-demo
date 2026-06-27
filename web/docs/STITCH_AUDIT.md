# Stitch Export Audit

Source ZIP: `stitch_hotel_rfid_operations_platform.zip`

Extraction folder: `temp/stitch-extracted/`

Audit date: 2026-06-27

## Summary

The Stitch export contains 17 visual screen PNGs, 18 HTML files, and 3 design-system Markdown files. The export mixes mobile/phone-width screens, older desktop screens, refined desktop screens, duplicate screen concepts, and one HTML-only duplicate dashboard export.

The final desktop reference set should be based on the refined desktop screens where available, with desktop-only fallbacks for screens that have no refined variant.

## Screen Inventory

| Export folder | Artifacts | Screenshot size | Classification | Notes |
| --- | --- | ---: | --- | --- |
| `dashboard_refined` | `screen.png`, `code.html` | 1280 x 1083 | KEEP | Final Dashboard reference. Refined nav includes Dashboard, RFID Scan, Linen Master, Laundry Batches, Reconciliation, Device Activity, Transaction History, and Asset Management. Uses `LB-DEMO-001`. |
| `rfid_scan_refined` | `screen.png` | 1600 x 1280 | KEEP | Final RFID Scan visual reference. Missing `code.html`; implementation must use PNG plus functional notes. |
| `linen_master_refined` | `screen.png`, `code.html` | 1600 x 1305 | KEEP | Final Linen Master reference. Refined hotel-linen terminology and expanded navigation. |
| `laundry_batches_desktop` | `screen.png`, `code.html` | 1600 x 1280 | KEEP | Best available Laundry Batches reference. Desktop layout, but demo data uses older batch IDs and terminology. |
| `reconciliation_refined` | `screen.png`, `code.html` | 1600 x 1280 | KEEP | Final Reconciliation reference. Prefer over `reconciliation` and `batch_reconciliation_desktop`. |
| `device_activity_desktop` | `screen.png`, `code.html` | 1600 x 1280 | KEEP | Final Device Activity reference. Includes reader-type concepts needed for later implementation. |
| `transaction_history_desktop` | `screen.png`, `code.html` | 1600 x 1280 | KEEP | Final Transaction History reference. Only discovered transaction history screen. |
| `asset_management_refined` | `screen.png`, `code.html` | 1600 x 1280 | KEEP | Final Asset Management reference. Must be positioned as a potential expansion use case, not the live linen deployment. |
| `dashboard_desktop` | `screen.png`, `code.html` | 1600 x 1064 | DISCARD | Older desktop Dashboard. Missing refined navigation entries for Device Activity and Transaction History. |
| `dashboard` | `screen.png`, `code.html` | 300 x 1600 | DISCARD | Mobile/phone-width Dashboard with bottom navigation. |
| `hotel_ops_linen_management` | `code.html` | none | DISCARD | HTML-only duplicate of older Dashboard/mobile-responsive concept. Missing `screen.png`. |
| `rfid_scan_desktop` | `screen.png`, `code.html` | 1600 x 1492 | DISCARD | Older desktop RFID Scan. Has HTML but less refined than `rfid_scan_refined`. |
| `rfid_scan` | `screen.png`, `code.html` | 377 x 1600 | DISCARD | Mobile/phone-width RFID Scan with bottom navigation. |
| `linen_master_desktop` | `screen.png`, `code.html` | 1600 x 1280 | DISCARD | Older desktop Linen Master; title and navigation still lean toward generic asset management. |
| `linen_master` | `screen.png`, `code.html` | 499 x 1600 | DISCARD | Mobile/phone-width Linen Master with bottom navigation and asset-first terminology. |
| `reconciliation` | `screen.png`, `code.html` | 706 x 1600 | DISCARD | Phone/tablet-width Reconciliation variant. |
| `batch_reconciliation_desktop` | `screen.png`, `code.html` | 1600 x 1280 | REVIEW | Desktop batch reconciliation variant, but older demo data shows 8 outstanding items and batch `#LB-2023-10-24-A`. Not selected because `reconciliation_refined` is the latest refined reference. |
| `asset_management_desktop` | `screen.png`, `code.html` | 1434 x 1600 | DISCARD | Older Asset Management desktop variant. Kept out in favor of `asset_management_refined`. |

## Design Documentation Inventory

| Folder | File | Classification | Notes |
| --- | --- | --- | --- |
| `lumina_hospitality_operations` | `DESIGN.md` | KEEP | Best design-system source. Uses Inter, JetBrains Mono, desktop layout, dark navy sidebar, warm neutral background, teal primary, gold warning, and red exception behavior. |
| `executive_command` | `DESIGN.md` | REVIEW | Similar desktop command-center direction, but typography differs from final standard. |
| `linen_asset_visibility_system` | `DESIGN.md` | REVIEW | Strong RFID/hotel operations notes, but conflicts with final typography and includes broader asset-system framing. |

## Duplicate And Variant Findings

- Mobile/phone-width screens: `dashboard`, `rfid_scan`, `linen_master`, and `reconciliation`.
- Old desktop screens: `dashboard_desktop`, `rfid_scan_desktop`, `linen_master_desktop`, `asset_management_desktop`, and `batch_reconciliation_desktop`.
- Refined desktop screens: `dashboard_refined`, `rfid_scan_refined`, `linen_master_refined`, `reconciliation_refined`, and `asset_management_refined`.
- Desktop-only screens without refined variants: `laundry_batches_desktop`, `device_activity_desktop`, and `transaction_history_desktop`.
- Duplicate design systems: `executive_command`, `linen_asset_visibility_system`, and `lumina_hospitality_operations`.
- HTML-only duplicate: `hotel_ops_linen_management/code.html`.

## Missing HTML Exports

- `rfid_scan_refined` has `screen.png` but no `code.html`.
- `hotel_ops_linen_management` has `code.html` but no `screen.png`; it was not selected.

## Naming Issues

- `batch_reconciliation_desktop` overlaps with the required `Reconciliation` screen name.
- `hotel_ops_linen_management` appears to be a dashboard duplicate but its folder name does not identify a screen.
- Some older files use generic `Asset Management` terminology where final navigation requires `Linen Master`.
- Refined screens use `Hotel RFID`, while final docs standardize the application name to `Hotel RFID Operations Platform`.

## Demo Data Issues

- Final standard requires active demo batch `LB-DEMO-001`, Linen Sent `8`, Linen Returned `7`, and Linen Outstanding `1`.
- Older screens include batch IDs such as `#LB-2023-1042`, `#LB-2023-10-24-A`, `Batch #4920`, and `Batch #1024`.
- `batch_reconciliation_desktop` shows 8 outstanding items, which conflicts with the required active demo batch discrepancy of 1.
- Older screens include labels such as `Outstanding/Lost`, `At Laundry`, and generic asset fields; implementation should use the standardized linen statuses and terms.

## Final Selection

The curated final desktop references are copied to `design-reference/final-desktop/`:

- `dashboard` from `dashboard_refined`
- `rfid-scan` from `rfid_scan_refined`
- `linen-master` from `linen_master_refined`
- `laundry-batches` from `laundry_batches_desktop`
- `reconciliation` from `reconciliation_refined`
- `device-activity` from `device_activity_desktop`
- `transaction-history` from `transaction_history_desktop`
- `asset-management` from `asset_management_refined`
