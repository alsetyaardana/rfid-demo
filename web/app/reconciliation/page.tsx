import { Badge, DataTable, Metric, SectionHead } from "@/components/ui";
import { demoBatchCode } from "@/lib/domain/demo-data";
import { getReconciliationData } from "@/lib/services/queries";
import { headers } from "next/headers";

export default async function ReconciliationPage() {
  const mode = headers().get("x-demo-mode") || "SIMULATION";
  const isHardware = mode === "HARDWARE";

  const { batch, reconciliation } = await getReconciliationData();
  const item = reconciliation.outstandingItems[0];

  if (isHardware && !batch) {
    return (
      <div className="screen">
        <SectionHead title="Batch Reconciliation" body="Discrepancy review calculated from sent transaction items minus valid returned transaction items." />
        <section className="empty-state">
          <h3>No batches to reconcile</h3>
          <p>Complete a SEND_TO_LAUNDRY transaction to begin reconciliation tracking.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="screen">
      <SectionHead title="Batch Reconciliation" body="Discrepancy review calculated from sent transaction items minus valid returned transaction items." action={<Badge>Derived From Database</Badge>} />
      <section className="grid-4">
        <Metric label="Batch ID" value={batch?.batchCode ?? (isHardware ? "-" : demoBatchCode)} note={isHardware ? "Active batch" : "Active demo batch"} tone="teal" />
        <Metric label="Sent" value={reconciliation.sentCount} note="Accepted send items" />
        <Metric label="Returned" value={reconciliation.returnedCount} note="Accepted returned items" tone="teal" />
        <Metric label="Outstanding" value={reconciliation.outstandingCount} note="Exact discrepancy" tone={reconciliation.outstandingCount > 0 ? "red" : "teal"} />
      </section>
      <section className="grid-3">
        <article className="card span-2">
          <div className="card-title"><h3>Outstanding Item</h3><Badge>Operational Exception</Badge></div>
          <DataTable
            headers={["Linen ID", "EPC", "Type", "Last Known Location", "Last Reader"]}
            rows={reconciliation.outstandingItems.map((outstanding) => [
              outstanding.linenCode,
              outstanding.epc,
              outstanding.linenType,
              outstanding.lastKnownLocation,
              outstanding.lastReader
            ])}
          />
        </article>
        <article className="card">
          <div className="card-title"><h3>Operational Insight</h3><Badge>{item ? "Action Needed" : "Clear"}</Badge></div>
          <p>
            {item
              ? `${item.linenCode} was sent with ${batch?.batchCode ?? (isHardware ? "this batch" : demoBatchCode)} but was not included in a valid return transaction. Inspect last known location and re-scan before closing the batch.`
              : `No outstanding linen is currently detected for the active ${isHardware ? "batch" : "demo batch"}.`}
          </p>
        </article>
      </section>
      {!isHardware && (
        <section className="card">
          <div className="card-title"><h3>Location Trace</h3><Badge>Last Known Path</Badge></div>
          <div className="mini-map">
            <div className="zone">Housekeeping</div><div className="zone">Service Lift</div><div className="zone active">Laundry Receiving</div><div className="zone alert">Dispatch Gate</div>
            <div className="zone">Room 702</div><div className="zone">Linen Room</div><div className="zone active">Wash Line</div><div className="zone">Clean Storage</div>
            <div className="zone">Lobby</div><div className="zone">Banquet</div><div className="zone">Pool</div><div className="zone">Vendor Exit</div>
          </div>
        </section>
      )}
    </div>
  );
}
