import Link from "next/link";
import { demoBatchCode } from "@/lib/domain/demo-data";
import { enumText, Badge, DataTable, Metric, SectionHead } from "@/components/ui";
import { ResetDemoButton, ScenarioButtons } from "@/components/demo-actions";
import { getDashboardData, getTransactionHistoryData } from "@/lib/services/queries";

export default async function DashboardPage() {
  const [dashboard, transactions] = await Promise.all([getDashboardData(), getTransactionHistoryData()]);
  const available = dashboard.linenCounts.AVAILABLE ?? 0;
  const inLaundry = dashboard.linenCounts.IN_LAUNDRY ?? 0;
  const outstanding = dashboard.reconciliation.outstandingCount;

  return (
    <div className="screen">
      <SectionHead
        title="Operations Dashboard"
        body="Real-time view of the active Porta Nusa Hotel linen RFID demo, calculated from persisted SQLite data."
        action={<ResetDemoButton />}
      />

      <section className="demo-band">
        <div>
          <h3>Tracking Laundry Batch <span className="mono">{demoBatchCode}</span></h3>
          <p>Workflow: RFID Scan to Laundry Transaction to Return to Reconciliation to Outstanding Linen.</p>
        </div>
        <Badge>{outstanding} Outstanding</Badge>
      </section>

      <section className="grid-4">
        <Metric label="Available" value={available} note="Persisted linen currently ready" tone="teal" />
        <Metric label="In Laundry" value={inLaundry} note="Updated by confirmed send transaction" tone="gold" />
        <Metric label="Transactions" value={dashboard.transactionCount} note="Confirmed persisted records" tone="teal" />
        <Metric label="Outstanding" value={outstanding} note="Sent minus valid returned" tone={outstanding > 0 ? "red" : "teal"} />
      </section>

      <section className="grid-3">
        <article className="card span-2">
          <div className="card-title"><h3>Run Demo Scenario</h3><Badge>Website Simulation</Badge></div>
          <p className="muted">Use these controls to execute the approved 8 sent, 7 returned, 1 outstanding storyline through the server-side processing layer.</p>
          <div style={{ marginTop: 16 }}><ScenarioButtons /></div>
        </article>
        <article className="card">
          <div className="card-title"><h3>Operational Insight</h3><Badge>Derived</Badge></div>
          <p>
            {outstanding > 0
              ? `One item remains outstanding for ${demoBatchCode}. Open Reconciliation to inspect the exact linen ID and EPC.`
              : "No outstanding linen has been detected yet for the active demo batch."}
          </p>
          <div className="button-row" style={{ marginTop: 16 }}>
            <Link className="btn secondary" href="/reconciliation">Open Reconciliation</Link>
          </div>
        </article>
      </section>

      <section className="card tight">
        <DataTable
          headers={["Transaction ID", "Activity", "Batch", "Items", "Reader", "Timestamp", "Status"]}
          badgeColumns={[6]}
          rows={transactions.slice(0, 5).map((transaction) => [
            transaction.transactionCode,
            enumText(transaction.transactionType),
            transaction.laundryBatch?.batchCode ?? "-",
            `${transaction.items.filter((item) => item.validationStatus === "ACCEPTED").length} accepted`,
            transaction.readerId,
            transaction.createdAt.toLocaleString(),
            "Confirmed"
          ])}
        />
      </section>
    </div>
  );
}
