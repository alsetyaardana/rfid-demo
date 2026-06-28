import Link from "next/link";
import { Badge, Metric } from "@/components/ui";
import { GenerateDataForm, ClearDataButton, ResetDemoButton } from "@/components/demo-actions";

export function SimulationDashboardPanel({ outstanding, metrics }: { outstanding: number, metrics: any }) {
  return (
    <section className="grid-3">
      <article className="card span-2">
        <div className="card-title">
          <h3>Simulation Data Management</h3>
          <Badge>Website Simulation</Badge>
        </div>
        <div className="grid-4" style={{ marginTop: 16 }}>
          <Metric label="Linen Master" value={`${metrics.linen} / ${metrics.limit}`} note="Generated tags" />
          <Metric label="Laundry Batches" value={`${metrics.batches} / ${metrics.limit}`} note="Simulated batches" />
          <Metric label="RFID Sessions" value={`${metrics.sessions} / ${metrics.limit}`} note="Simulated scans" />
          <Metric label="Transactions" value={`${metrics.transactions} / ${metrics.limit}`} note="Simulated logic" />
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <GenerateDataForm />
          <div style={{ flex: 1 }} />
          <ClearDataButton />
          <ResetDemoButton />
        </div>
      </article>
      <article className="card">
        <div className="card-title">
          <h3>Operational Insight</h3>
          <Badge>Derived</Badge>
        </div>
        <p>
          {outstanding > 0
            ? `One or more items remain outstanding. Open Reconciliation to inspect the exact linen ID and EPC.`
            : "No outstanding linen has been detected yet for active batches."}
        </p>
        <div className="button-row" style={{ marginTop: 16 }}>
          <Link className="btn secondary" href="/reconciliation">Open Reconciliation</Link>
        </div>
      </article>
    </section>
  );
}

export function HardwareDashboardPanel({ 
  transactionCount, 
  lastTransaction,
  hasActivity
}: { 
  transactionCount: number;
  lastTransaction?: any;
  hasActivity: boolean;
}) {
  if (!hasActivity) {
    return (
      <section className="empty-state">
        <h3>No hardware RFID activity has been received yet</h3>
        <p>Please connect the Chainway C5 and submit a physical scan to populate the dashboard.</p>
        <div className="button-row" style={{ marginTop: 16 }}>
          <Link href="/guides/hardware" className="btn secondary">Hardware Setup Guide</Link>
          <button className="btn primary" disabled>Download Android APK</button>
        </div>
      </section>
    );
  }

  return (
    <section className="grid-3">
      <article className="card span-2">
        <div className="card-title">
          <h3>Hardware Operations</h3>
          <Badge>Live Reader</Badge>
        </div>
        <div className="grid-2">
          <div className="metric teal" style={{ minHeight: '80px', paddingBottom: 0, borderBottom: 'none' }}>
            <label>API Status</label>
            <strong style={{ fontSize: '20px' }}>Online</strong>
            <small>Listening for C5 hardware</small>
          </div>
          <div className="metric teal" style={{ minHeight: '80px', paddingBottom: 0, borderBottom: 'none' }}>
            <label>Latest Transaction</label>
            <strong style={{ fontSize: '20px' }}>{lastTransaction?.transactionType ?? "-"}</strong>
            <small>{lastTransaction?.createdAt?.toLocaleString() ?? "No transactions yet"}</small>
          </div>
        </div>
        <div className="button-row" style={{ marginTop: 16 }}>
          <button className="btn primary" disabled>Register Physical EPC</button>
          <Link className="btn secondary" href="/device-activity">Open Device Activity</Link>
        </div>
      </article>
      <article className="card">
        <div className="card-title">
          <h3>Hardware Setup</h3>
          <Badge>Resources</Badge>
        </div>
        <p className="muted">Ensure your Chainway C5 is connected to the same network and configured with the correct API URL and Demo Mode.</p>
        <div className="button-row" style={{ marginTop: 16 }}>
          <Link href="/guides/hardware" className="btn secondary">Hardware Setup Guide</Link>
          <button className="btn secondary" disabled>Download Android APK</button>
        </div>
      </article>
    </section>
  );
}
