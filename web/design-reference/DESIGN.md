# Hotel RFID Operations Platform Design Reference

This document is the visual source of truth for future implementation. Stitch screenshots and HTML are references only; do not import Stitch HTML blindly if it conflicts with the chosen application architecture.

## Application Name

Hotel RFID Operations Platform

## Platform

- Desktop-first web application
- Target viewport: 1440 x 900
- Minimum desktop width: 1280 px
- Persistent left sidebar
- Top header
- No mobile bottom navigation

## Navigation

- Dashboard
- RFID Scan
- Linen Master
- Laundry Batches
- Reconciliation
- Device Activity
- Transaction History
- Asset Management

## Typography

- Inter for general interface text
- JetBrains Mono for EPC, Reader ID, and Session ID

## Color Behavior

- Dark navy sidebar
- Warm neutral application background
- White content cards
- Teal primary actions and success states
- Gold warning and pending states
- Red only for exceptions, errors, outstanding items, and destructive actions

## Linen Statuses

- Available
- In Use
- Dirty
- In Laundry
- Returned Clean
- Outstanding
- Damaged
- Retired

## Primary Demo Data

Use this scenario consistently during implementation:

- Batch ID: `LB-DEMO-001`
- Linen Sent: `8`
- Linen Returned: `7`
- Linen Outstanding: `1`

Large values may be used for hotel-wide dashboard totals, but not for the active demo batch.

## Asset Management Positioning

Asset Management must be labeled:

`Potential Expansion Use Case`

It must not imply that asset management is part of the demonstrated Crowne Plaza linen deployment.

## Final Desktop References

- `design-reference/final-desktop/dashboard/`
- `design-reference/final-desktop/rfid-scan/`
- `design-reference/final-desktop/linen-master/`
- `design-reference/final-desktop/laundry-batches/`
- `design-reference/final-desktop/reconciliation/`
- `design-reference/final-desktop/device-activity/`
- `design-reference/final-desktop/transaction-history/`
- `design-reference/final-desktop/asset-management/`

## Implementation Guidance

- Prefer the refined desktop screenshots as the highest visual authority.
- Use desktop navigation only; do not implement mobile bottom navigation from older exports.
- Preserve the left sidebar and top header structure.
- Treat the screenshots as visual references, not complete functional specifications.
- Use `docs/UI_IMPLEMENTATION_NOTES.md` for required functional corrections and workflow behavior.
