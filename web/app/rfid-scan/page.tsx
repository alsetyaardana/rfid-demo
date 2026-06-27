import { Badge, DataTable, SectionHead } from "@/components/ui";
import { ScenarioButtons } from "@/components/demo-actions";
import { getRfidScanData } from "@/lib/services/queries";
import { enumText } from "@/components/ui";

export default async function RfidScanPage() {
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
        title="RFID Scan"
        body="Website simulator for handheld operation and fixed reader emulator. Both flows use the same server-side processing logic."
        action={<ScenarioButtons />}
      />

      <section className="grid-3">
        <article className="card span-2">
          <div className="card-title"><h3>Simulation Controls</h3><Badge>{data.batch?.batchCode ?? "No Batch"}</Badge></div>
          <div className="segmented" aria-label="Simulation source">
            <span className="active">Website Simulation</span>
            <span>Live Device</span>
          </div>
          <div style={{ height: 12 }} />
          <div className="segmented" aria-label="Operation mode">
            <span className="active">Handheld Operation</span>
            <span>Fixed Reader Emulator</span>
          </div>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="field"><label>Activity</label><select defaultValue="send"><option value="send">Send to Laundry</option><option value="return">Return from Laundry</option></select></div>
            <div className="field"><label>Location</label><select defaultValue="LDY-GATE"><option>Laundry Dispatch Gate</option><option>Laundry Return Desk</option></select></div>
            <div className="field"><label>Laundry Batch</label><input className="mono" readOnly value={data.batch?.batchCode ?? ""} /></div>
            <div className="field"><label>Reader ID</label><input className="mono" readOnly value="HH-MGR-04 / FX-LDY-02" /></div>
          </div>
        </article>
        <article className="card">
          <div className="card-title"><h3>Fixed Reader Emulator</h3><Badge>Auto Upload Active</Badge></div>
          <div className="countdown">30s</div>
          <p className="muted">Reader ID FX-LDY-02 monitors Laundry Dispatch Gate and stores sessions through the shared processing layer.</p>
        </article>
      </section>

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
