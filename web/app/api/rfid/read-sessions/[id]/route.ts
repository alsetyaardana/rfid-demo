import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateApiKey } from "@/lib/api/rfid-api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const prisma = getDb();
  const auth = validateApiKey(request.headers);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const session = await prisma.rFIDReadSession.findFirst({
    where: { OR: [{ id: params.id }, { clientSessionId: params.id }] },
    include: {
      reads: { orderBy: { epc: "asc" } },
      transaction: { include: { laundryBatch: true, items: { include: { linen: true } } } }
    }
  });

  if (!session) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "RFID read session not found." } }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    session: {
      id: session.id,
      clientSessionId: session.clientSessionId,
      readerId: session.readerId,
      readerType: session.readerType,
      operationMode: session.operationMode,
      checkpoint: session.checkpoint,
      transactionType: session.transactionType,
      rawReadCount: session.rawReadCount,
      uniqueTagCount: session.uniqueTagCount,
      createdAt: session.createdAt
    },
    reads: session.reads,
    transaction: session.transaction ? {
      id: session.transaction.id,
      transactionCode: session.transaction.transactionCode,
      transactionType: session.transaction.transactionType,
      laundryBatchCode: session.transaction.laundryBatch?.batchCode ?? null,
      items: session.transaction.items.map((item) => ({
        epc: item.epc,
        linenCode: item.linen?.linenCode ?? null,
        validationStatus: item.validationStatus,
        previousStatus: item.previousStatus,
        newStatus: item.newStatus
      }))
    } : null
  });
}
