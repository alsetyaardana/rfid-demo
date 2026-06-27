import { z } from "zod";
import { OperationMode, ReaderType, TransactionType, ValidationStatus } from "@/lib/domain/enums";
import { normalizeEpc } from "@/lib/domain/epc";
import type { ProcessedSessionEnvelope, ProcessSessionInput } from "@/lib/services/rfid-processing";

export const apiReaderType = z.enum(["SIMULATOR", "HANDHELD", "FIXED_READER_EMULATOR", "FIXED_READER"]);
export const apiOperationMode = z.enum(["SIMULATION", "MANUAL", "AUTOMATIC"]);
export const apiDataSource = z.enum(["WEBSITE_SIMULATION", "LIVE_DEVICE"]);
export const apiTransactionType = z.enum(["STOCK_COUNT", "SEND_TO_LAUNDRY", "RETURN_FROM_LAUNDRY", "ASSET_AUDIT"]);

export const rfidReadSessionRequestSchema = z.object({
  clientSessionId: z.string().min(1),
  readerId: z.string().min(1),
  readerType: apiReaderType,
  operationMode: apiOperationMode,
  dataSource: apiDataSource,
  checkpoint: z.string().min(1),
  transactionType: apiTransactionType,
  laundryBatchCode: z.string().optional(),
  operatorName: z.string().optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  tags: z.array(z.object({
    epc: z.string().min(1),
    rssi: z.number().int().optional().default(-55),
    antenna: z.string().nullable().optional(),
    readCount: z.number().int().positive().optional().default(1),
    firstSeenAt: z.string().datetime({ offset: true }).optional(),
    lastSeenAt: z.string().datetime({ offset: true }).optional()
  })).min(1)
});

export type RfidReadSessionRequest = z.infer<typeof rfidReadSessionRequestSchema>;

export function validateApiKey(headers: Headers) {
  const expected = process.env.RFID_API_KEY;
  const provided = headers.get("x-rfid-api-key");

  if (!expected) {
    return { ok: false as const, status: 500, body: { success: false, error: { code: "API_KEY_NOT_CONFIGURED", message: "RFID API key is not configured on the server." } } };
  }

  if (!provided || provided !== expected) {
    return { ok: false as const, status: 401, body: { success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid X-RFID-API-Key header." } } };
  }

  return { ok: true as const };
}

export function toProcessSessionInput(payload: RfidReadSessionRequest): ProcessSessionInput {
  assertSupportedCombination(payload);
  const transactionType = mapTransactionType(payload.transactionType);

  return {
    clientSessionId: payload.clientSessionId,
    readerId: payload.readerId,
    readerType: mapReaderType(payload.readerType),
    operationMode: mapOperationMode(payload),
    checkpoint: payload.checkpoint,
    transactionType,
    laundryBatchCode: payload.laundryBatchCode,
    sourceLocationCode: sourceLocationFor(transactionType),
    destinationLocationCode: destinationLocationFor(transactionType),
    confirm: transactionType === TransactionType.SEND_TO_LAUNDRY || transactionType === TransactionType.RETURN_FROM_LAUNDRY,
    reads: expandTags(payload.tags)
  };
}

export function buildApiResponse(envelope: ProcessedSessionEnvelope, input: ProcessSessionInput) {
  return {
    success: true,
    idempotentReplay: envelope.idempotentReplay,
    session: {
      id: envelope.result.sessionId,
      clientSessionId: input.clientSessionId,
      readerId: input.readerId,
      readerType: input.readerType,
      operationMode: input.operationMode,
      transactionType: input.transactionType
    },
    summary: {
      rawReadCount: envelope.result.rawReadCount,
      uniqueEpcCount: envelope.result.uniqueTagCount,
      registeredCount: envelope.result.registeredCount,
      unknownCount: envelope.result.unknownCount,
      acceptedCount: envelope.result.acceptedCount,
      rejectedCount: envelope.result.rejectedCount,
      duplicateCount: envelope.result.duplicateCount
    },
    items: envelope.result.itemResults.map((item) => ({
      epc: item.epc,
      linenCode: item.linenCode ?? null,
      linenType: item.linenType ?? null,
      status: item.validationStatus,
      reason: item.validationStatus === ValidationStatus.ACCEPTED ? null : reasonFor(item.validationStatus),
      readCount: item.readCount
    })),
    transaction: envelope.result.transactionCode ? {
      id: envelope.result.transactionId,
      transactionCode: envelope.result.transactionCode,
      transactionType: input.transactionType
    } : null
  };
}

export function validationError(message: string, details?: unknown) {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      details
    }
  };
}

function expandTags(tags: RfidReadSessionRequest["tags"]) {
  return tags.flatMap((tag) => {
    const count = tag.readCount ?? 1;
    return Array.from({ length: count }, () => ({
      epc: normalizeEpc(tag.epc),
      rssi: tag.rssi,
      antenna: tag.antenna ?? undefined
    }));
  });
}

function mapReaderType(readerType: RfidReadSessionRequest["readerType"]) {
  return ReaderType[readerType];
}

function mapOperationMode(payload: RfidReadSessionRequest) {
  if (payload.operationMode === "AUTOMATIC") return OperationMode.AUTOMATIC;
  if (payload.operationMode === "MANUAL") return OperationMode.MANUAL;
  if (payload.operationMode === "SIMULATION") return OperationMode.SIMULATION;
  if (payload.dataSource === "WEBSITE_SIMULATION") return OperationMode.WEBSITE_SIMULATION;
  if (payload.readerType === "FIXED_READER_EMULATOR") return OperationMode.FIXED_READER_EMULATOR;
  if (payload.readerType === "HANDHELD") return OperationMode.HANDHELD_OPERATION;
  return OperationMode.LIVE_DEVICE;
}

function mapTransactionType(transactionType: RfidReadSessionRequest["transactionType"]) {
  if (transactionType === "ASSET_AUDIT") {
    throw new ApiValidationError("ASSET_AUDIT is recognized but not implemented in the Website-only linen MVP.");
  }
  return TransactionType[transactionType];
}

function assertSupportedCombination(payload: RfidReadSessionRequest) {
  if (payload.readerType === "HANDHELD" && payload.operationMode === "AUTOMATIC") {
    throw new ApiValidationError("HANDHELD readers must use MANUAL or SIMULATION operation mode.");
  }
  if ((payload.readerType === "FIXED_READER" || payload.readerType === "FIXED_READER_EMULATOR") && payload.operationMode === "MANUAL") {
    throw new ApiValidationError("Fixed reader clients must use AUTOMATIC or SIMULATION operation mode.");
  }
  if ((payload.transactionType === "SEND_TO_LAUNDRY" || payload.transactionType === "RETURN_FROM_LAUNDRY") && !payload.laundryBatchCode) {
    throw new ApiValidationError("laundryBatchCode is required for laundry transactions.");
  }
}

function sourceLocationFor(transactionType: ProcessSessionInput["transactionType"]) {
  if (transactionType === TransactionType.RETURN_FROM_LAUNDRY) return "EXT-LDY";
  if (transactionType === TransactionType.SEND_TO_LAUNDRY) return "LINEN-RM";
  return "LINEN-RM";
}

function destinationLocationFor(transactionType: ProcessSessionInput["transactionType"]) {
  if (transactionType === TransactionType.RETURN_FROM_LAUNDRY) return "LINEN-RM";
  if (transactionType === TransactionType.SEND_TO_LAUNDRY) return "EXT-LDY";
  return undefined;
}

function reasonFor(status: ValidationStatus) {
  if (status === ValidationStatus.UNKNOWN_EPC) return "EPC is not registered in the linen master.";
  if (status === ValidationStatus.WRONG_BATCH) return "Returned linen does not belong to the selected laundry batch.";
  if (status === ValidationStatus.ALREADY_RETURNED) return "Linen has already been returned for this batch.";
  return "Read was rejected by business validation.";
}

export class ApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiValidationError";
  }
}
