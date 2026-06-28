import Link from "next/link";
import { enumText, Badge, DataTable, Metric, SectionHead } from "@/components/ui";
import { getDashboardData, getTransactionHistoryData } from "@/lib/services/queries";
import { getSimulationMetrics } from "@/lib/services/simulation";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";
import { HardwareDashboardPanel, SimulationDashboardPanel } from "@/components/mode-panels/DashboardPanels";

export default async function DashboardPage() {
  const mode = headers().get("x-demo-mode") || "SIMULATION";
  const isHardware = mode === "HARDWARE";

  const [dashboard, transactions] = await Promise.all([getDashboardData(), getTransactionHistoryData()]);
  const available = dashboard.linenCounts.AVAILABLE ?? 0;
  const inLaundry = dashboard.linenCounts.IN_LAUNDRY ?? 0;
  const outstanding = dashboard.reconciliation.outstandingCount;
  
  const simulationMetrics = !isHardware ? await getSimulationMetrics(getDb("SIMULATION")) : null;

  return (
    <div className="screen">
      <SectionHead
        title="Operations Dashboard"
        body="Real-time view of the active Porta Nusa Hotel linen RFID demo, calculated from persisted SQLite data."
      />

      {!isHardware && (
        <section className="demo-band">
          <div>
            <h3>Simulation Data Management</h3>
            <p>Generate isolated operational records to evaluate workflows without physical RFID hardware.</p>
          </div>
          <Badge>{outstanding} Outstanding</Badge>
        </section>
      )}

      <section className="grid-4">
        <Metric label="Available" value={available} note="Persisted linen currently ready" tone="teal" />
        <Metric label="In Laundry" value={inLaundry} note="Updated by confirmed send transaction" tone="gold" />
        <Metric label="Transactions" value={dashboard.transactionCount} note="Confirmed persisted records" tone="teal" />
        <Metric label="Outstanding" value={outstanding} note="Sent minus valid returned" tone={outstanding > 0 ? "red" : "teal"} />
      </section>

      {isHardware ? (
        <HardwareDashboardPanel 
          transactionCount={dashboard.transactionCount}
          lastTransaction={transactions[0]}
          hasActivity={transactions.length > 0 || dashboard.transactionCount > 0} 
        />
      ) : (
        <SimulationDashboardPanel outstanding={outstanding} metrics={simulationMetrics!} />
      )}

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
