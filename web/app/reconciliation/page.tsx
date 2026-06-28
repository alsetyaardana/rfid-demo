import { Badge, DataTable, Metric, SectionHead } from "@/components/ui";
import { getReconciliationData } from "@/lib/services/queries";
import { headers } from "next/headers";

export default async function ReconciliationPage() {
  const mode = headers().get("x-demo-mode") || "SIMULATION";
  const isHardware = mode === "HARDWARE";

  const activeBatches = await getReconciliationData();

  const totalSent = activeBatches.reduce((s, { reconciliation }) => s + reconciliation.sentCount, 0);
  const totalReturned = activeBatches.reduce((s, { reconciliation }) => s + reconciliation.returnedCount, 0);
  const totalOutstanding = activeBatches.reduce((s, { reconciliation }) => s + reconciliation.outstandingCount, 0);

  return (
    <div className="screen">
      <SectionHead
        title="Batch Reconciliation"
        body="Discrepancy review calculated from accepted send items minus accepted return items per batch."
        action={<Badge>Derived From Database</Badge>}
      />
      {activeBatches.length === 0 ? (
        <section className="empty-state">
          <h3>No batches to reconcile</h3>
          <p>All sent items have been returned, or no laundry batch has been started.</p>
        </section>
      ) : (
        <>
          <section className="grid-4">
            <Metric label="Active Batches" value={activeBatches.length} note="Batches with outstanding items" tone="teal" />
            <Metric label="Total Sent" value={totalSent} note="Accepted send items" />
            <Metric label="Total Returned" value={totalReturned} note="Accepted return items" tone="teal" />
            <Metric label="Total Outstanding" value={totalOutstanding} note="Exact discrepancy" tone={totalOutstanding > 0 ? "red" : "teal"} />
          </section>

          {activeBatches.map(({ batch, reconciliation }) => (
            <section key={batch.id} className="grid-3">
              <article className="card span-2">
                <div className="card-title">
                  <h3>{batch.batchCode}</h3>
                  <Badge>{reconciliation.outstandingCount} Outstanding</Badge>
                </div>
                <DataTable
                  headers={["Linen ID", "EPC", "Type", "Last Known Location", "Last Reader"]}
                  rows={reconciliation.outstandingItems.map((item) => [
                    item.linenCode,
                    item.epc,
                    item.linenType,
                    item.lastKnownLocation,
                    item.lastReader
                  ])}
                />
              </article>
              <article className="card">
                <div className="card-title">
                  <h3>Operational Insight</h3>
                  <Badge>{reconciliation.outstandingCount > 0 ? "Action Needed" : "Clear"}</Badge>
                </div>
                <p>
                  {reconciliation.outstandingItems[0]
                    ? `${reconciliation.outstandingItems[0].linenCode} was sent with ${batch.batchCode} but was not included in a valid return transaction. Inspect last known location and re-scan before closing the batch.`
                    : `No outstanding linen detected for ${batch.batchCode}.`}
                </p>
                <p style={{ marginTop: "0.5rem" }}>
                  Sent: {reconciliation.sentCount} · Returned: {reconciliation.returnedCount} · Outstanding: {reconciliation.outstandingCount}
                </p>
              </article>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
