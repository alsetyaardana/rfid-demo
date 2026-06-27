export function normalizeEpc(epc: string): string {
  return epc.trim().replace(/[\s:-]/g, "").toUpperCase();
}

export type CollapsedRead = {
  epc: string;
  readCount: number;
  rssi: number;
  antenna?: string;
};

export type RawReadInput = {
  epc: string;
  rssi?: number;
  antenna?: string;
};

export function collapseDuplicateReads(reads: RawReadInput[]): CollapsedRead[] {
  const byEpc = new Map<string, CollapsedRead>();

  for (const read of reads) {
    const epc = normalizeEpc(read.epc);
    if (!epc) continue;

    const existing = byEpc.get(epc);
    if (existing) {
      existing.readCount += 1;
      existing.rssi = Math.max(existing.rssi, read.rssi ?? existing.rssi);
      continue;
    }

    byEpc.set(epc, {
      epc,
      readCount: 1,
      rssi: read.rssi ?? -55,
      antenna: read.antenna
    });
  }

  return Array.from(byEpc.values());
}
