import { Badge } from "@/components/ui";
import Link from "next/link";

export function SimulationScanPanel({ batchCode }: { batchCode: string }) {
  return (
    <section className="grid-3">
      <article className="card span-2">
        <div className="card-title">
          <h3>Simulation Controls</h3>
          <Badge>{batchCode}</Badge>
        </div>
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
          <div className="field">
            <label>Activity</label>
            <select defaultValue="send">
              <option value="send">Send to Laundry</option>
              <option value="return">Return from Laundry</option>
            </select>
          </div>
          <div className="field">
            <label>Location</label>
            <select defaultValue="LDY-GATE">
              <option>Laundry Dispatch Gate</option>
              <option>Laundry Return Desk</option>
            </select>
          </div>
          <div className="field">
            <label>Laundry Batch</label>
            <input className="mono" readOnly value={batchCode} />
          </div>
          <div className="field">
            <label>Reader ID</label>
            <input className="mono" readOnly value="HH-MGR-04 / FX-LDY-02" />
          </div>
        </div>
      </article>
      <article className="card">
        <div className="card-title">
          <h3>Fixed Reader Emulator</h3>
          <Badge>Auto Upload Active</Badge>
        </div>
        <div className="countdown">30s</div>
        <p className="muted">Reader ID FX-LDY-02 monitors Laundry Dispatch Gate and stores sessions through the shared processing layer.</p>
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
