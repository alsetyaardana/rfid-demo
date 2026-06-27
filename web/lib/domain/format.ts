import type { LinenStatus, OperationMode, ReaderType, TransactionType, ValidationStatus } from "@/lib/domain/enums";

export function displayStatus(status: LinenStatus | ValidationStatus | AssetLikeStatus | string): string {
  return status
    .toString()
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function displayOperationMode(mode: OperationMode): string {
  return displayEnum(mode);
}

export function displayReaderType(type: ReaderType): string {
  return displayEnum(type);
}

export function displayTransactionType(type: TransactionType): string {
  if (type === "SEND_TO_LAUNDRY") return "Send to Laundry";
  if (type === "RETURN_FROM_LAUNDRY") return "Return from Laundry";
  if (type === "FIXED_READER_UPLOAD") return "Fixed Reader Upload";
  return "Stock Count";
}

export function displayEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type AssetLikeStatus = "HEALTHY" | "IN_USE" | "INSPECTION_DUE" | "RETIRED";
