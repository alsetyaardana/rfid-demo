import { AssetStatus, LaundryBatchStatus, LinenStatus, LocationType } from "@/lib/domain/enums";

export const demoBatchCode = "LB-DEMO-001";

export const locationSeeds = [
  { code: "HK-F7", name: "Housekeeping Floor 7", locationType: LocationType.HOTEL },
  { code: "LINEN-RM", name: "Main Linen Room", locationType: LocationType.STORAGE },
  { code: "LDY-RET", name: "Laundry Return Desk", locationType: LocationType.CHECKPOINT },
  { code: "LDY-GATE", name: "Laundry Dispatch Gate", locationType: LocationType.CHECKPOINT },
  { code: "EXT-LDY", name: "Central Laundry", locationType: LocationType.LAUNDRY }
];

export const linenSeeds = [
  ["LN-TWL-001", "EPC30080001", "Bath Towel", LinenStatus.AVAILABLE, "LINEN-RM", 24],
  ["LN-TWL-002", "EPC30080002", "Bath Towel", LinenStatus.AVAILABLE, "LINEN-RM", 23],
  ["LN-TWL-003", "EPC30080003", "Bath Towel", LinenStatus.AVAILABLE, "LINEN-RM", 21],
  ["LN-HND-004", "EPC30080004", "Hand Towel", LinenStatus.AVAILABLE, "LINEN-RM", 19],
  ["LN-BED-005", "EPC30080005", "Bed Sheet", LinenStatus.AVAILABLE, "LINEN-RM", 18],
  ["LN-BED-006", "EPC30080006", "Bed Sheet", LinenStatus.AVAILABLE, "LINEN-RM", 18],
  ["LN-PIL-007", "EPC30080007", "Pillowcase", LinenStatus.AVAILABLE, "LINEN-RM", 26],
  ["LN-DUV-008", "EPC30080008", "Duvet Cover", LinenStatus.AVAILABLE, "LINEN-RM", 15],
  ["LN-TWL-009", "EPC30080009", "Bath Towel", LinenStatus.IN_USE, "HK-F7", 11],
  ["LN-HND-010", "EPC30080010", "Hand Towel", LinenStatus.DIRTY, "HK-F7", 17],
  ["LN-BED-011", "EPC30080011", "Bed Sheet", LinenStatus.AVAILABLE, "LINEN-RM", 22],
  ["LN-PIL-012", "EPC30080012", "Pillowcase", LinenStatus.AVAILABLE, "LINEN-RM", 20]
] as const;

export const activeDemoSendEpcs = linenSeeds.slice(0, 8).map(([, epc]) => epc);
export const activeDemoReturnEpcs = activeDemoSendEpcs.slice(0, 7);
export const activeDemoOutstandingEpc = activeDemoSendEpcs[7];

export const assetSeeds = [
  ["AST-ROOM-104", "AST90010001", "Ironing Board", "Housekeeping", AssetStatus.HEALTHY, "HK-F7"],
  ["AST-BQT-018", "AST90010002", "Banquet Trolley", "Banquet", AssetStatus.IN_USE, "LDY-GATE"],
  ["AST-LDY-006", "AST90010003", "Laundry Cart", "Laundry", AssetStatus.INSPECTION_DUE, "EXT-LDY"],
  ["AST-FNB-022", "AST90010004", "Coffee Urn", "F&B", AssetStatus.HEALTHY, "LINEN-RM"]
] as const;

export const initialDemoBatch = {
  batchCode: demoBatchCode,
  status: LaundryBatchStatus.CREATED,
  sourceCode: "LINEN-RM",
  destinationCode: "EXT-LDY"
};
