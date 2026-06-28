const S = {
  page: { padding: "40px 32px", maxWidth: "900px", margin: "0 auto" } as const,
  h1: { fontSize: "2rem", fontWeight: 800, color: "var(--navy)", margin: "0 0 6px" } as const,
  subtitle: { color: "var(--muted)", fontSize: "1rem", margin: "0 0 32px" } as const,
  toc: {
    display: "flex", flexWrap: "wrap" as const, gap: "8px",
    padding: "16px", borderRadius: "8px",
    background: "var(--surface-soft)", border: "1px solid var(--line)",
    marginBottom: "40px",
  },
  tocLink: { color: "var(--teal)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 } as const,
  section: { marginBottom: "40px" } as const,
  h2: { fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)", margin: "0 0 12px", paddingTop: "8px", borderTop: "2px solid var(--teal-soft)" } as const,
  h3: { fontSize: "1.05rem", fontWeight: 700, color: "var(--navy-soft)", margin: "16px 0 8px" } as const,
  p: { color: "var(--text)", lineHeight: 1.65, margin: "0 0 12px" } as const,
  calloutInfo: { padding: "12px 16px", borderRadius: "6px", background: "var(--blue-soft)", border: "1px solid #b3cef5", color: "var(--navy)", fontSize: "0.9rem", marginBottom: "12px" } as const,
  calloutWarn: { padding: "12px 16px", borderRadius: "6px", background: "var(--gold-soft)", border: "1px solid #e0c840", color: "#5a4000", fontSize: "0.9rem", marginBottom: "12px" } as const,
  calloutDanger: { padding: "12px 16px", borderRadius: "6px", background: "var(--red-soft)", border: "1px solid #f5a0a0", color: "var(--red)", fontSize: "0.9rem", marginBottom: "12px" } as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.9rem" } as const,
  th: { background: "var(--surface-soft)", padding: "8px 12px", textAlign: "left" as const, border: "1px solid var(--line)", fontWeight: 700, color: "var(--navy)" } as const,
  td: { padding: "8px 12px", border: "1px solid var(--line)", color: "var(--text)", verticalAlign: "top" as const } as const,
  ul: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  checkRow: { display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid var(--line)", alignItems: "flex-start" } as const,
  checkbox: { width: "18px", height: "18px", border: "2px solid var(--line-strong)", borderRadius: "4px", marginTop: "2px", flexShrink: 0 } as const,
  stopBox: { padding: "14px 18px", borderRadius: "8px", background: "var(--red-soft)", border: "2px solid var(--red)", marginBottom: "12px" } as const,
  stopTitle: { fontWeight: 800, color: "var(--red)", marginBottom: "6px", fontSize: "1rem" } as const,
};

const tocItems = [
  ["#pre-demo", "Pre-Demo Checks"],
  ["#sim-sequence", "Simulation Mode Demo Sequence"],
  ["#hw-sequence", "Hardware Mode Demo Sequence"],
  ["#fallback", "Fallback Procedures"],
  ["#evidence", "Evidence to Capture"],
  ["#stop-conditions", "Stop Conditions"],
  ["#post-demo", "Post-Demo Reset and Cleanup"],
];

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={S.checkRow}>
      <div style={S.checkbox} aria-hidden="true" />
      <span style={{ color: "var(--text)", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export default function OperatorChecklist() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Demo Operator Checklist</h1>
      <p style={S.subtitle}>Print or open on a secondary device during live demonstrations.</p>

      <nav style={S.toc} aria-label="Page sections">
        {tocItems.map(([href, label]) => (
          <a key={href} href={href} style={S.tocLink}>{label}</a>
        ))}
      </nav>

      {/* PRE-DEMO CHECKS */}
      <section id="pre-demo" style={S.section}>
        <h2 style={S.h2}>Pre-Demo Checks</h2>
        <p style={S.p}>Complete all items before the audience arrives.</p>

        <h3 style={S.h3}>Server and Network</h3>
        <CheckItem>Web server is running (<code>npm run dev</code> in <code>web/</code> or equivalent).</CheckItem>
        <CheckItem>Browser opens the platform dashboard at the correct local address.</CheckItem>
        <CheckItem>Wi-Fi network is available and stable on the demo machine.</CheckItem>

        <h3 style={S.h3}>Browser</h3>
        <CheckItem>Browser is confirmed in the correct starting mode (Simulation or Hardware — decide before the demo).</CheckItem>
        <CheckItem>All 8 nav pages load without errors (Dashboard, RFID Scan, Linen Master, Laundry Batches, Reconciliation, Device Activity, Transaction History, Asset Management).</CheckItem>
        <CheckItem>All four guide routes load: <code>/guides/system-overview</code>, <code>/guides/simulation</code>, <code>/guides/hardware</code>, <code>/guides/operator-checklist</code>.</CheckItem>

        <h3 style={S.h3}>Simulation Mode Data</h3>
        <CheckItem>Sidebar shows Simulation Mode.</CheckItem>
        <CheckItem>Click <strong>Clear Generated Data</strong> in Simulation Tools.</CheckItem>
        <CheckItem>Click <strong>Generate Demo Data</strong>. Dashboard shows non-zero linen item count.</CheckItem>
        <CheckItem>Laundry Batches page shows at least one In Progress batch (from generated data).</CheckItem>
        <CheckItem>Reconciliation page shows matching outstanding items.</CheckItem>

        <h3 style={S.h3}>Hardware Mode (if using C5)</h3>
        <CheckItem>Chainway C5 is powered on and <strong>Porta Nusa Operator</strong> app is open.</CheckItem>
        <CheckItem>C5 Settings: Server URL points to the correct local server IP and port.</CheckItem>
        <CheckItem>C5 Settings: Power Profile is set to the intended starting profile (recommend: Medium).</CheckItem>
        <CheckItem>SAVE CONFIGURATION tapped on C5.</CheckItem>
        <CheckItem>Test STOCK_COUNT scan performed — session appears in Device Activity within a few seconds.</CheckItem>
        <CheckItem>At least one linen item is registered in <code>hardware.db</code> (visible in Linen Master, Hardware Mode).</CheckItem>
        <CheckItem>At least one RFID tag with a known EPC is available for physical demonstration.</CheckItem>

        <div style={S.calloutWarn}>
          <strong>APK freshness check:</strong> If the C5 has not been used for more than a few days or the
          source branch was updated, rebuild and reinstall the APK before the demo.
        </div>
      </section>

      {/* SIMULATION MODE SEQUENCE */}
      <section id="sim-sequence" style={S.section}>
        <h2 style={S.h2}>Simulation Mode Demo Sequence</h2>
        <p style={S.p}>Target duration: 8–12 minutes. No physical hardware required.</p>

        <h3 style={S.h3}>Opening</h3>
        <CheckItem>Confirm sidebar shows <strong>Simulation Mode</strong> with active status dot.</CheckItem>
        <CheckItem>Open <strong>Dashboard</strong>. Walk audience through live metric cards.</CheckItem>

        <h3 style={S.h3}>STOCK_COUNT</h3>
        <CheckItem>Navigate to <strong>RFID Scan</strong>.</CheckItem>
        <CheckItem>Select <strong>STOCK_COUNT</strong> workflow.</CheckItem>
        <CheckItem>Choose 5–8 linen items and submit session.</CheckItem>
        <CheckItem>Show accepted results and EPC list in the result summary.</CheckItem>

        <h3 style={S.h3}>SEND_TO_LAUNDRY</h3>
        <CheckItem>RFID Scan → <strong>SEND_TO_LAUNDRY</strong> → batch code <code>LB-SIM-001</code>.</CheckItem>
        <CheckItem>Select the same items → Submit.</CheckItem>
        <CheckItem>Navigate to <strong>Laundry Batches</strong> — confirm batch <code>LB-SIM-001</code> appears, status <strong>In Progress</strong>.</CheckItem>

        <h3 style={S.h3}>Partial RETURN and Reconciliation</h3>
        <CheckItem>RFID Scan → <strong>RETURN_FROM_LAUNDRY</strong> → <code>LB-SIM-001</code> → select only half the sent items → Submit.</CheckItem>
        <CheckItem>Navigate to <strong>Reconciliation</strong> — show outstanding items listed under <code>LB-SIM-001</code>.</CheckItem>

        <h3 style={S.h3}>Wrong-Batch Rejection</h3>
        <CheckItem>RFID Scan → <strong>RETURN_FROM_LAUNDRY</strong> → enter batch code <code>LB-WRONG</code> → submit with original items.</CheckItem>
        <CheckItem>Show all results as <code>WRONG_BATCH</code>. Explain the cross-batch safety mechanism.</CheckItem>

        <h3 style={S.h3}>Complete RETURN and Resolution</h3>
        <CheckItem>RFID Scan → <strong>RETURN_FROM_LAUNDRY</strong> → <code>LB-SIM-001</code> → remaining items → Submit.</CheckItem>
        <CheckItem>Reconciliation: batch card disappears. Empty state shown.</CheckItem>
        <CheckItem>Laundry Batches: <code>LB-SIM-001</code> status is now <strong>Completed</strong>.</CheckItem>

        <h3 style={S.h3}>Closing</h3>
        <CheckItem>Navigate to <strong>Transaction History</strong> — show full audit trail including rejected sessions.</CheckItem>
        <CheckItem>Return to <strong>Dashboard</strong> — outstanding count is now zero.</CheckItem>
      </section>

      {/* HARDWARE MODE SEQUENCE */}
      <section id="hw-sequence" style={S.section}>
        <h2 style={S.h2}>Hardware Mode Demo Sequence</h2>
        <p style={S.p}>Requires Chainway C5 and physical RFID tags. Pre-demo checks must be complete.</p>

        <h3 style={S.h3}>Mode and Connectivity</h3>
        <CheckItem>Switch browser to <strong>Hardware Mode</strong>.</CheckItem>
        <CheckItem>Confirm C5 Settings show the correct Server URL and Power Profile.</CheckItem>

        <h3 style={S.h3}>EPC Registration (if new tags)</h3>
        <CheckItem>Trigger STOCK_COUNT on C5 with new tag in range.</CheckItem>
        <CheckItem>Browser Linen Master → unknown EPC appears in queue within ~2.5 seconds (no refresh).</CheckItem>
        <CheckItem>Assign Linen Code and Type → Register. Confirm tag is now in the registered list.</CheckItem>

        <h3 style={S.h3}>STOCK_COUNT (physical)</h3>
        <CheckItem>C5: workflow = STOCK_COUNT → trigger scan → stop → upload.</CheckItem>
        <CheckItem>Browser Device Activity or Transaction History: session appears with ACCEPTED results.</CheckItem>

        <h3 style={S.h3}>SEND_TO_LAUNDRY (physical)</h3>
        <CheckItem>C5: workflow = SEND_TO_LAUNDRY → batch code = <code>LB-HW-001</code> → scan tags → upload.</CheckItem>
        <CheckItem>Browser Laundry Batches: <code>LB-HW-001</code> In Progress with correct Sent count.</CheckItem>

        <h3 style={S.h3}>Power Profile Demo (optional)</h3>
        <CheckItem>C5 Settings → change to <strong>Near</strong> → SAVE → scan same items (fewer reads).</CheckItem>
        <CheckItem>C5 Settings → change to <strong>Far</strong> → SAVE → scan (more reads, wider area).</CheckItem>
        <CheckItem>Restore to <strong>Medium</strong> → SAVE for remaining operations.</CheckItem>

        <h3 style={S.h3}>RETURN_FROM_LAUNDRY (physical)</h3>
        <CheckItem>C5: workflow = RETURN_FROM_LAUNDRY → batch code = <code>LB-HW-001</code> → scan returned tags → upload.</CheckItem>
        <CheckItem>Browser Reconciliation: outstanding decreases. If all returned, batch disappears.</CheckItem>

        <h3 style={S.h3}>Closing</h3>
        <CheckItem>Transaction History: all sessions (STOCK_COUNT, SEND, RETURN) visible with timestamps.</CheckItem>
        <CheckItem>Dashboard: metrics reflect current hardware state.</CheckItem>
      </section>

      {/* FALLBACK */}
      <section id="fallback" style={S.section}>
        <h2 style={S.h2}>Fallback Procedures</h2>

        <h3 style={S.h3}>C5 Unavailable or Not Connecting</h3>
        <div style={S.calloutInfo}>
          <strong>Fallback:</strong> Switch the browser to Simulation Mode and continue the demo using the
          browser-only workflow. All core capabilities (STOCK_COUNT, SEND, RETURN, Reconciliation) are
          fully demonstrable without physical hardware.
        </div>
        <CheckItem>Announce: &ldquo;I&apos;ll demonstrate the same workflow using the built-in simulation engine.&rdquo;</CheckItem>
        <CheckItem>Clear Generated Data → Generate Demo Data → proceed with Simulation Mode demo sequence.</CheckItem>

        <h3 style={S.h3}>Web Server Unavailable</h3>
        <CheckItem>Confirm the terminal running <code>npm run dev</code> is still active — no crash or port conflict.</CheckItem>
        <CheckItem>Restart web server if needed: <code>npm run dev</code> in <code>web/</code>.</CheckItem>
        <CheckItem>If server cannot start, demonstrate using pre-captured screenshots or a screen recording.</CheckItem>

        <h3 style={S.h3}>Network Connectivity Lost</h3>
        <CheckItem>For Simulation Mode: network is not required. Continue without interruption.</CheckItem>
        <CheckItem>For Hardware Mode: C5 uploads will fail. Switch to Simulation Mode fallback.</CheckItem>
        <CheckItem>If only audience connectivity is affected (projector/screen share): continue operating locally and share screen via cable.</CheckItem>

        <h3 style={S.h3}>RFID Tags Not Being Read</h3>
        <CheckItem>Check Power Profile — switch to <strong>Medium</strong> or <strong>Far</strong> for broader coverage.</CheckItem>
        <CheckItem>Ensure tags are oriented horizontally within read range.</CheckItem>
        <CheckItem>Restart RFID module: close and reopen the C5 app.</CheckItem>
        <CheckItem>If tags still unread after restart: switch to Simulation Mode fallback.</CheckItem>
      </section>

      {/* EVIDENCE */}
      <section id="evidence" style={S.section}>
        <h2 style={S.h2}>Evidence and Screenshots to Capture</h2>
        <p style={S.p}>Capture the following during or immediately after the demo for records and follow-up materials.</p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Evidence Item</th><th style={S.th}>Where to Capture</th><th style={S.th}>Priority</th></tr>
          </thead>
          <tbody>
            {[
              ["Dashboard with live metrics", "Browser Dashboard page", "High"],
              ["RFID Scan result showing ACCEPTED items", "RFID Scan result summary", "High"],
              ["Laundry Batch In Progress with correct Sent count", "Laundry Batches page", "High"],
              ["Reconciliation showing outstanding items", "Reconciliation page during partial return", "High"],
              ["Reconciliation empty state after full return", "Reconciliation page", "High"],
              ["WRONG_BATCH rejection result", "RFID Scan result summary", "Medium"],
              ["Transaction History audit trail", "Transaction History page", "Medium"],
              ["C5 app main screen with status", "Physical device or screen recording", "Medium (Hardware only)"],
              ["Browser Linen Master showing unknown EPC in queue", "Linen Master page (Hardware Mode)", "Medium (Hardware only)"],
              ["Power profile spinner in C5 Settings", "Physical device", "Low (optional demo)"],
            ].map(([item, location, priority]) => (
              <tr key={item}>
                <td style={S.td}>{item}</td>
                <td style={S.td}>{location}</td>
                <td style={S.td}>{priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* STOP CONDITIONS */}
      <section id="stop-conditions" style={S.section}>
        <h2 style={S.h2}>Stop Conditions</h2>
        <p style={S.p}>
          Stop the active demonstration step immediately if any of the following occur.
          Do not attempt to continue or explain away the issue in real time.
        </p>

        <div style={S.stopBox}>
          <p style={S.stopTitle}>STOP — Server crash or unrecoverable error</p>
          <p style={{ margin: 0, color: "var(--text)", fontSize: "0.9rem" }}>
            If the web server crashes mid-demo: pause, restart the server, and resume from the last
            completed checkpoint. Do not attempt to narrate through a broken UI.
          </p>
        </div>

        <div style={S.stopBox}>
          <p style={S.stopTitle}>STOP — Results do not match expected behavior</p>
          <p style={{ margin: 0, color: "var(--text)", fontSize: "0.9rem" }}>
            If a workflow produces unexpected results (e.g., ACCEPTED where WRONG_BATCH is expected,
            or data appears in the wrong mode): stop, note the discrepancy, and do not proceed.
            Do not claim the result is correct. Investigate after the demo.
          </p>
        </div>

        <div style={S.stopBox}>
          <p style={S.stopTitle}>STOP — Hardware mode data visible in Simulation Mode (or vice versa)</p>
          <p style={{ margin: 0, color: "var(--text)", fontSize: "0.9rem" }}>
            Database isolation is a core guarantee. If hardware data appears in Simulation Mode or
            simulation data in Hardware Mode, stop the demo immediately. This represents a critical
            system integrity failure requiring investigation before any further demonstration.
          </p>
        </div>

        <div style={S.calloutWarn}>
          <strong>In all stop cases:</strong> acknowledge the pause to the audience, switch to a
          prepared fallback (screenshots, Simulation Mode, or a pre-recorded walkthrough), and
          document the exact symptom immediately after the session.
        </div>
      </section>

      {/* POST-DEMO CLEANUP */}
      <section id="post-demo" style={S.section}>
        <h2 style={S.h2}>Post-Demo Reset and Cleanup</h2>

        <h3 style={S.h3}>Simulation Mode</h3>
        <CheckItem>In the sidebar Simulation Tools: click <strong>Clear Generated Data</strong>.</CheckItem>
        <CheckItem>Optionally run <strong>Generate Demo Data</strong> to pre-seed for the next session.</CheckItem>
        <CheckItem>Confirm Dashboard metrics reset to a clean state.</CheckItem>

        <h3 style={S.h3}>Hardware Mode</h3>
        <div style={S.calloutWarn}>
          <strong>No reset UI for hardware.db exists in this MVP.</strong> Hardware data persists between
          sessions. This is intentional — <code>hardware.db</code> represents a real operational record.
          If a clean hardware state is required for the next demo, the database file must be manually
          replaced. Do not reset hardware data unless explicitly instructed by the Owner/Architect.
        </div>
        <CheckItem>Power off or return the Chainway C5 to its storage location.</CheckItem>
        <CheckItem>Note any anomalies observed during the demo for the Owner/Architect debrief.</CheckItem>

        <h3 style={S.h3}>General</h3>
        <CheckItem>Close any browser tabs exposing internal data to avoid accidental disclosure.</CheckItem>
        <CheckItem>Archive any captured screenshots or screen recordings to the designated evidence folder.</CheckItem>
        <CheckItem>File a debrief note: date, mode(s) demonstrated, audience, outcome, and any anomalies.</CheckItem>
      </section>
    </div>
  );
}
