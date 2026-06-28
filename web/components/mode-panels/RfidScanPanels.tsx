import { Badge } from "@/components/ui";
import Link from "next/link";

export function SimulationScanPanel({
  batchCode,
  latestSession,
}: {
  batchCode: string;
  latestSession?: {
    transactionType?: string;
    createdAt?: Date;
    readerId?: string;
  };
}) {
  return (
    <section className="grid-3">
      <article className="card span-2">
        <div className="card-title">
          <h3>Simulation Session View</h3>
          <Badge>Read Only</Badge>
        </div>
        <p className="muted" style={{ marginTop: 16 }}>
          Simulation Mode does not provide a live browser RFID emulator in this MVP. This page is limited to
          recorded session visibility for the active <span className="mono">simulation.db</span> dataset.
        </p>
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="metric teal" style={{ minHeight: "80px", paddingBottom: 0, borderBottom: "none" }}>
            <label>Latest Workflow</label>
            <strong style={{ fontSize: "20px" }}>{latestSession?.transactionType ?? "-"}</strong>
            <small>{latestSession?.createdAt?.toLocaleString() ?? "No recorded simulation session"}</small>
          </div>
          <div className="metric teal" style={{ minHeight: "80px", paddingBottom: 0, borderBottom: "none" }}>
            <label>Latest Batch</label>
            <strong style={{ fontSize: "20px" }}>{batchCode}</strong>
            <small>{latestSession?.readerId ?? "No reader context recorded"}</small>
          </div>
        </div>
      </article>
      <article className="card">
        <div className="card-title">
          <h3>Operator Guidance</h3>
          <Badge>Simulation MVP</Badge>
        </div>
        <p className="muted">
          Use the Dashboard as the canonical location for Generate Demo Data, Clear Generated Data, and Reset Database.
          Use Transaction History, Laundry Batches, and Reconciliation to explain the seeded workflow state.
        </p>
        <div className="button-row" style={{ marginTop: 16 }}>
          <Link className="btn secondary" href="/">Open Dashboard</Link>
          <Link className="btn secondary" href="/transaction-history">View Transaction History</Link>
        </div>
      </article>
    </section>
  );
}

export function HardwareActivityPanel({ latestSession }: { latestSession?: any }) {
  return (
    <section className="grid-3">
      <article className="card span-2">
        <div className="card-title">
          <h3>Hardware Scan Activity</h3>
          <Badge>API Mode: HARDWARE</Badge>
        </div>
        <div className="grid-2">
          <div className="metric teal" style={{ minHeight: '80px', paddingBottom: 0, borderBottom: 'none' }}>
            <label>Reader ID</label>
            <strong style={{ fontSize: '20px' }}>{latestSession?.readerId ?? "-"}</strong>
            <small>Latest physical device</small>
          </div>
          <div className="metric teal" style={{ minHeight: '80px', paddingBottom: 0, borderBottom: 'none' }}>
            <label>Last Transaction</label>
            <strong style={{ fontSize: '20px' }}>{latestSession?.transactionType ?? "-"}</strong>
            <small>{latestSession?.completedAt?.toLocaleString() ?? "No sessions received"}</small>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 16 }}>
          The backend is listening for physical RFID scans from the Android Chainway C5.
        </p>
        <div className="button-row" style={{ marginTop: 16 }}>
          <Link className="btn secondary" href="/device-activity">View Device Activity</Link>
          <button className="btn primary" disabled>Register Physical EPC</button>
        </div>
      </article>
      <article className="card">
        <div className="card-title">
          <h3>Android Configuration</h3>
          <Badge>Resources</Badge>
        </div>
        <p className="muted">
          Ensure the physical device sets <span className="mono">X-Demo-Mode: HARDWARE</span> when uploading.
        </p>
        <div className="button-row" style={{ marginTop: 16 }}>
          <Link href="/guides/hardware" className="btn secondary">Hardware Setup Guide</Link>
          <button className="btn secondary" disabled>Download Android APK</button>
        </div>
      </article>
    </section>
  );
}
