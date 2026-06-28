import { Badge, DataTable, SectionHead } from "@/components/ui";
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
        title={isHardware ? "RFID Hardware Activity" : "Simulation RFID Session Visibility"}
        body={isHardware ? "Monitoring live hardware sessions from the Android C5." : "Read-only view of recorded simulation session results. Dashboard data-management actions remain the only operator controls in Simulation Mode."}
      />

      {isHardware ? (
        <HardwareActivityPanel latestSession={latest} />
      ) : (
        <SimulationScanPanel batchCode={data.batch?.batchCode ?? "No Batch"} latestSession={latest} />
      )}

      <section className="grid-4">
        <article className="card metric teal"><label>Latest Raw Reads</label><strong>{rawCount}</strong><small>Includes duplicates in the newest recorded session</small></article>
        <article className="card metric teal"><label>Latest Unique EPC</label><strong>{uniqueCount}</strong><small>Normalized from the newest recorded session</small></article>
        <article className="card metric gold"><label>Latest Duplicates</label><strong>{duplicateCount}</strong><small>Removed during session processing</small></article>
        <article className="card metric red"><label>Latest Unknown</label><strong>{unknownCount}</strong><small>Not registered in the active mode dataset</small></article>
      </section>
      <section className="grid-2">
        <article className="card metric teal"><label>Latest Accepted</label><strong>{acceptedCount}</strong><small>Persisted as valid results</small></article>
        <article className="card metric red"><label>Latest Rejected</label><strong>{rejectedCount}</strong><small>Unknown, wrong batch, or already returned</small></article>
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
