import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLinenCount, getRecentUnknownEpcs } from "@/lib/services/queries";

export async function GET() {
  const mode = headers().get("x-demo-mode") ?? "SIMULATION";

  if (mode !== "HARDWARE") {
    return NextResponse.json(
      {
        recentUnknowns: [],
        totalLinen: 0,
        limit: 100
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const [recentUnknowns, totalLinen] = await Promise.all([
    getRecentUnknownEpcs("HARDWARE"),
    getLinenCount("HARDWARE")
  ]);

  return NextResponse.json(
    {
      recentUnknowns: recentUnknowns.map((item) => ({
        ...item,
        timestamp: item.timestamp.toISOString()
      })),
      totalLinen,
      limit: 100
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
