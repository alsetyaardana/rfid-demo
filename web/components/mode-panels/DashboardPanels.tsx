import Link from "next/link";
import { Badge } from "@/components/ui";
import { ScenarioButtons } from "@/components/demo-actions";
import { demoBatchCode } from "@/lib/domain/demo-data";

export function SimulationDashboardPanel({ outstanding }: { outstanding: number }) {
  return (
    <section className="grid-3">
      <article className="card span-2">
        <div className="card-title">
          <h3>Run Demo Scenario</h3>
          <Badge>Website Simulation</Badge>
        </div>
        <p className="muted">Use these controls to execute the approved 8 sent, 7 returned, 1 outstanding storyline through the server-side processing layer.</p>
        <div style={{ marginTop: 16 }}><ScenarioButtons /></div>
      </article>
      <article className="card">
        <div className="card-title">
          <h3>Operational Insight</h3>
          <Badge>Derived</Badge>
        </div>
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
