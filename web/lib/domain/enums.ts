export const LinenStatus = {
  AVAILABLE: "AVAILABLE",
  IN_USE: "IN_USE",
  DIRTY: "DIRTY",
  IN_LAUNDRY: "IN_LAUNDRY",
  RETURNED_CLEAN: "RETURNED_CLEAN",
  OUTSTANDING: "OUTSTANDING",
  DAMAGED: "DAMAGED",
  RETIRED: "RETIRED"
} as const;

export type LinenStatus = (typeof LinenStatus)[keyof typeof LinenStatus];

export const LocationType = {
  HOTEL: "HOTEL",
  LAUNDRY: "LAUNDRY",
  CHECKPOINT: "CHECKPOINT",
  STORAGE: "STORAGE"
} as const;

export const LaundryBatchStatus = {
  CREATED: "CREATED",
  SENT: "SENT",
  PARTIALLY_RETURNED: "PARTIALLY_RETURNED",
  COMPLETED: "COMPLETED",
  RECONCILIATION_REQUIRED: "RECONCILIATION_REQUIRED"
} as const;

export const TransactionType = {
  SEND_TO_LAUNDRY: "SEND_TO_LAUNDRY",
  RETURN_FROM_LAUNDRY: "RETURN_FROM_LAUNDRY",
  STOCK_COUNT: "STOCK_COUNT",
  FIXED_READER_UPLOAD: "FIXED_READER_UPLOAD"
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const OperationMode = {
  HANDHELD_OPERATION: "HANDHELD_OPERATION",
  FIXED_READER_EMULATOR: "FIXED_READER_EMULATOR",
  LIVE_DEVICE: "LIVE_DEVICE",
  WEBSITE_SIMULATION: "WEBSITE_SIMULATION",
  SIMULATION: "SIMULATION",
  MANUAL: "MANUAL",
  AUTOMATIC: "AUTOMATIC"
} as const;

export type OperationMode = (typeof OperationMode)[keyof typeof OperationMode];

export const ReaderType = {
  SIMULATOR: "SIMULATOR",
  HANDHELD: "HANDHELD",
  FIXED_READER_EMULATOR: "FIXED_READER_EMULATOR",
  FIXED_READER: "FIXED_READER"
} as const;

export type ReaderType = (typeof ReaderType)[keyof typeof ReaderType];

export const ValidationStatus = {
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  DUPLICATE: "DUPLICATE",
  UNKNOWN_EPC: "UNKNOWN_EPC",
  WRONG_BATCH: "WRONG_BATCH",
  ALREADY_RETURNED: "ALREADY_RETURNED"
} as const;

export type ValidationStatus = (typeof ValidationStatus)[keyof typeof ValidationStatus];

export const AssetStatus = {
  HEALTHY: "HEALTHY",
  IN_USE: "IN_USE",
  INSPECTION_DUE: "INSPECTION_DUE",
  RETIRED: "RETIRED"
} as const;
