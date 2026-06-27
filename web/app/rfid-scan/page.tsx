import { Badge, DataTable, SectionHead } from "@/components/ui";
import { ScenarioButtons } from "@/components/demo-actions";
import { getRfidScanData } from "@/lib/services/queries";
import { enumText } from "@/components/ui";
import { headers } from "next/headers";
import { HardwareActivityPanel, SimulationScanPanel } from "@/components/mode-panels/RfidScanPanels";

export default async function RfidScanPage() {
  const mode = headers().get("x-demo-mode") || "SIMULATION";
  const isHardware = mode === "HARDWARE";

  const data = await getRfidScanData();
  const latest = data.latestSessions[0];
  const rawCount = latest?.rawReadCount ?? 0;
  const uniqueCount = latest?.uniqueTagCount ?? 0;
  const unknownCount = latest?.reads.filter((read) => read.validationStatus === "UNKNOWN_EPC").length ?? 0;
  const duplicateCount = Math.max(rawCount - uniqueCount, 0);
  const acceptedCount = latest?.reads.filter((read) => read.validationStatus === "ACCEPTED").length ?? 0;
  const rejectedCount = latest?.reads.filter((read) => read.validationStatus !== "ACCEPTED").length ?? 0;

  return (
    <div className="screen">
      <SectionHead
        title={isHardware ? "RFID Hardware Activity" : "RFID Scan Simulation"}
        body={isHardware ? "Monitoring live hardware sessions from the Android C5." : "Website simulator for handheld operation and fixed reader emulator. Both flows use the same server-side processing logic."}
        action={!isHardware ? <ScenarioButtons /> : undefined}
      />

      {isHardware ? (
        <HardwareActivityPanel latestSession={latest} />
      ) : (
        <SimulationScanPanel batchCode={data.batch?.batchCode ?? "No Batch"} />
      )}

      <section className="grid-4">
        <article className="card metric teal"><label>Raw Reads</label><strong>{rawCount}</strong><small>Includes duplicates</small></article>
        <article className="card metric teal"><label>Unique EPC</label><strong>{uniqueCount}</strong><small>Normalized and collapsed</small></article>
        <article className="card metric gold"><label>Duplicates</label><strong>{duplicateCount}</strong><small>Removed per session</small></article>
        <article className="card metric red"><label>Unknown</label><strong>{unknownCount}</strong><small>Displayed but not registered</small></article>
      </section>
      <section className="grid-2">
        <article className="card metric teal"><label>Accepted</label><strong>{acceptedCount}</strong><small>Eligible for transaction processing</small></article>
        <article className="card metric red"><label>Rejected</label><strong>{rejectedCount}</strong><small>Unknown, wrong batch, or already returned</small></article>
      </section>

      <section className="card tight">
        <DataTable
          headers={["EPC", "RSSI", "Read Count", "Antenna", "Validation Status"]}
          badgeColumns={[4]}
          rows={(latest?.reads ?? []).map((read) => [read.epc, `${read.rssi} dBm`, read.readCount, read.antenna ?? "-", enumText(read.validationStatus)])}
        />
      </section>
    </div>
  );
}
