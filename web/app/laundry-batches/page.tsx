import { Badge, DataTable, Metric, SectionHead } from "@/components/ui";
import { enumText } from "@/components/ui";
import { getLaundryBatchData, getSentReturnSummary } from "@/lib/services/queries";

export default async function LaundryBatchesPage() {
  const batches = await getLaundryBatchData();
  const summaries = await Promise.all(batches.map((batch) => getSentReturnSummary(batch.id)));

  return (
    <div className="screen">
      <SectionHead title="Laundry Batches" body="Batch-level dispatch and return tracking derived from confirmed transaction items." action={<Badge>LB-DEMO-001 Active</Badge>} />
      <section className="grid-3">
        <Metric label="Batches" value={batches.length} note="Persisted laundry batches" tone="teal" />
        <Metric label="Sent Items" value={summaries.reduce((sum, item) => sum + item.sent, 0)} note="Accepted send items" />
        <Metric label="Outstanding" value={summaries.reduce((sum, item) => sum + item.outstanding, 0)} note="Sent minus returned" tone="red" />
      </section>
      <section className="card tight">
        <DataTable
          headers={["Batch ID", "Source", "Destination", "Sent", "Returned", "Outstanding", "Status"]}
          badgeColumns={[6]}
          rows={batches.map((batch, index) => [
            batch.batchCode,
            batch.sourceLocation.name,
            batch.destinationLocation.name,
            summaries[index].sent,
            summaries[index].returned,
            summaries[index].outstanding,
            enumText(batch.status)
          ])}
        />
      </section>
    </div>
  );
}
