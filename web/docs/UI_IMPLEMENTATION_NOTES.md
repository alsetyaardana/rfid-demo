# UI Implementation Notes

Stitch screenshots are visual references. Future implementation must include the functional corrections below even when a screenshot is incomplete, older, or missing corresponding HTML.

## RFID Scan Requirements

The final implementation must support these operation paths:

- Handheld Operation
- Fixed Reader Emulator
- Live Device
- Website Simulation

### Handheld Operation Behavior

- User selects activity
- User selects location
- User selects laundry batch when required
- User starts and stops scanning
- User reviews the result
- User confirms the transaction

### Fixed Reader Emulator Behavior

- Reader ID
- Checkpoint
- Automatic rule
- Read window
- Continuous monitoring
- Automatic upload
- No manual confirmation as the primary workflow
- Start Monitoring action
- Active read-window countdown
- Auto Upload Active status

### RFID Result Table

The RFID result table should include:

- EPC
- Linen ID
- Linen Type
- Reader ID
- Reader Type
- Operation Mode
- RSSI
- Timestamp
- Validation Status

## Reconciliation Requirements

Display:

- Batch ID
- Sent quantity
- Returned quantity
- Outstanding quantity
- Exact outstanding item
- Last known location
- Last scan time
- Last reader or checkpoint
- Operational insight explaining the discrepancy

Use the active demo scenario consistently:

- Batch ID: `LB-DEMO-001`
- Linen Sent: `8`
- Linen Returned: `7`
- Linen Outstanding: `1`

## Device Activity Requirements

Display:

- Timestamp
- Reader ID
- Reader Type
- Operation Mode
- Checkpoint
- Session ID
- Unique Tag Count
- Upload Status
- Created Transaction

Supported reader types:

- Simulator
- Handheld
- Fixed Reader Emulator
- Fixed Reader

## Important Correction Notes

- `rfid_scan_refined` has no HTML export; implement from screenshot plus these functional requirements.
- Older RFID Scan exports use generic asset fields. Final implementation must use linen-specific result data and reader metadata.
- Fixed Reader Emulator should behave as an automated monitoring workflow, not as a manual confirmation-first workflow.
- Reconciliation must identify the single outstanding item for `LB-DEMO-001`, not a generic multi-item discrepancy.
- Device Activity must distinguish reader type from operation mode.
