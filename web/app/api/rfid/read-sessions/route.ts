import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { ApiValidationError, buildApiResponse, rfidReadSessionRequestSchema, toProcessSessionInput, validateApiKey, validationError } from "@/lib/api/rfid-api";
import { processOrReplayRfidReadSession } from "@/lib/services/rfid-processing";

export async function POST(request: Request) {
  const auth = validateApiKey(request.headers);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  try {
    const json = await request.json();
    const payload = rfidReadSessionRequestSchema.parse(json);
    const input = toProcessSessionInput(payload);
    const envelope = await processOrReplayRfidReadSession(prisma, input);

    return NextResponse.json(buildApiResponse(envelope, input), { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(validationError("Invalid RFID read session payload.", error.flatten()), { status: 400 });
    }
    if (error instanceof ApiValidationError) {
      return NextResponse.json(validationError(error.message), { status: 400 });
    }
    if (error instanceof Error && /Laundry batch is required|not found|required/i.test(error.message)) {
      return NextResponse.json(validationError(error.message), { status: 400 });
    }

    console.error("RFID API read-session error", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Unable to process RFID read session." } }, { status: 500 });
  }
}
