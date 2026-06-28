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
  card: { padding: "16px 20px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface)", marginBottom: "12px" } as const,
  calloutInfo: { padding: "12px 16px", borderRadius: "6px", background: "var(--blue-soft)", border: "1px solid #b3cef5", color: "var(--navy)", fontSize: "0.9rem", marginBottom: "12px" } as const,
  calloutTip: { padding: "12px 16px", borderRadius: "6px", background: "var(--teal-soft)", border: "1px solid var(--teal)", color: "var(--teal-dark)", fontSize: "0.9rem", marginBottom: "12px" } as const,
  calloutWarn: { padding: "12px 16px", borderRadius: "6px", background: "var(--gold-soft)", border: "1px solid #e0c840", color: "#5a4000", fontSize: "0.9rem", marginBottom: "12px" } as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.9rem" } as const,
  th: { background: "var(--surface-soft)", padding: "8px 12px", textAlign: "left" as const, border: "1px solid var(--line)", fontWeight: 700, color: "var(--navy)" } as const,
  td: { padding: "8px 12px", border: "1px solid var(--line)", color: "var(--text)", verticalAlign: "top" as const } as const,
  ul: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  ol: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  step: { display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" } as const,
  stepNum: { minWidth: "28px", height: "28px", borderRadius: "999px", background: "var(--teal)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem" } as const,
};

const tocItems = [
  ["#enter-sim", "Entering Simulation Mode"],
  ["#data-management", "Data Reset and Seed"],
  ["#scan", "Simulated RFID Scan"],
  ["#linen-master", "Linen Master"],
  ["#laundry-batches", "Laundry Batches"],
  ["#reconciliation", "Reconciliation"],
  ["#transaction-history", "Transaction History"],
  ["#dashboard", "Dashboard"],
  ["#demo-flow", "Recommended Demo Sequence"],
  ["#cleanup", "Cleanup and Reset"],
];

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={S.step}>
      <span style={S.stepNum}>{n}</span>
      <span style={{ color: "var(--text)", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export default function SimulationGuide() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Simulation Mode User Guide</h1>
      <p style={S.subtitle}>Complete all steps using the browser only — no physical hardware required.</p>

      <nav style={S.toc} aria-label="Page sections">
        {tocItems.map(([href, label]) => (
          <a key={href} href={href} style={S.tocLink}>{label}</a>
        ))}
      </nav>

      {/* ENTERING SIMULATION MODE */}
      <section id="enter-sim" style={S.section}>
        <h2 style={S.h2}>Entering Simulation Mode</h2>
        <Step n={1}>Open the Porta Nusa Hotel RFID platform in the browser.</Step>
        <Step n={2}>Look at the bottom-left sidebar. If the status shows <strong>Hardware Mode</strong>, click <strong>Switch Demo Mode</strong>.</Step>
        <Step n={3}>The status dot and label should now read <strong>Simulation Mode</strong>. All pages now read from and write to <code>simulation.db</code>.</Step>
        <div style={S.calloutInfo}>
          <strong>Isolation guarantee:</strong> Switching to Simulation Mode has no effect on <code>hardware.db</code>.
          Hardware data is never visible or modifiable from Simulation Mode.
        </div>
      </section>

      {/* DATA MANAGEMENT */}
      <section id="data-management" style={S.section}>
        <h2 style={S.h2}>Data Reset and Seed</h2>
        <p style={S.p}>
          The Simulation Tools panel appears in the sidebar when Simulation Mode is active.
          It provides two actions to manage synthetic demo data.
        </p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Action</th><th style={S.th}>What it does</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><strong>Generate Demo Data</strong></td>
              <td style={S.td}>Creates a set of synthetic linen items, laundry batches, and transaction records in <code>simulation.db</code>. Safe to run multiple times — capped at 100 linen items total.</td>
            </tr>
            <tr>
              <td style={S.td}><strong>Clear Generated Data</strong></td>
              <td style={S.td}>Removes all synthetic records from <code>simulation.db</code>, returning the database to an empty state. Use this before a fresh demo run.</td>
            </tr>
          </tbody>
        </table>
        <div style={S.calloutWarn}>
          <strong>Pre-demo recommendation:</strong> Always run <strong>Clear Generated Data</strong> followed by
          <strong> Generate Demo Data</strong> at the start of each demo session to ensure a clean, consistent
          starting state.
        </div>
      </section>

      {/* SIMULATED SCAN */}
      <section id="scan" style={S.section}>
        <h2 style={S.h2}>Simulated RFID Scan</h2>
        <p style={S.p}>
          The <strong>RFID Scan</strong> page allows you to simulate RFID scan sessions directly from the browser.
          No physical reader is needed.
        </p>
        <Step n={1}>Navigate to <strong>RFID Scan</strong> in the left sidebar.</Step>
        <Step n={2}>Select a workflow: <strong>STOCK_COUNT</strong>, <strong>SEND_TO_LAUNDRY</strong>, or <strong>RETURN_FROM_LAUNDRY</strong>.</Step>
        <Step n={3}>For SEND or RETURN, enter a batch code (e.g., <code>LB-SIM-001</code>).</Step>
        <Step n={4}>Select EPC tags to include in the scan from the available linen items.</Step>
        <Step n={5}>Click <strong>Submit Session</strong>. The result summary shows accepted and rejected items.</Step>
        <div style={S.calloutTip}>
          <strong>Tip:</strong> Use the same batch code for SEND and RETURN to demonstrate the full laundry cycle.
          Try submitting a RETURN with a different batch code to demonstrate <code>WRONG_BATCH</code> rejection.
        </div>
      </section>

      {/* LINEN MASTER */}
      <section id="linen-master" style={S.section}>
        <h2 style={S.h2}>Linen Master</h2>
        <p style={S.p}>
          The <strong>Linen Master</strong> page shows all registered linen items in the active mode database.
          In Simulation Mode, this displays items created by the Generate Demo Data action.
        </p>
        <ul style={S.ul}>
          <li>Each row shows the EPC, Linen Code, Linen Type, and registration status.</li>
          <li>Items flagged as <code>UNKNOWN_EPC</code> appear in a registration queue at the top (Simulation Mode can generate these too).</li>
          <li>The list is read-only in the current MVP — items are registered via the scan workflow or the hardware registration panel.</li>
        </ul>
      </section>

      {/* LAUNDRY BATCHES */}
      <section id="laundry-batches" style={S.section}>
        <h2 style={S.h2}>Laundry Batches</h2>
        <p style={S.p}>
          The <strong>Laundry Batches</strong> page lists all laundry batches created by SEND_TO_LAUNDRY sessions.
        </p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Column</th><th style={S.th}>Description</th></tr>
          </thead>
          <tbody>
            <tr><td style={S.td}>Batch Code</td><td style={S.td}>The code submitted with the SEND_TO_LAUNDRY session</td></tr>
            <tr><td style={S.td}>Sent</td><td style={S.td}>Count of accepted sent items</td></tr>
            <tr><td style={S.td}>Returned</td><td style={S.td}>Count of accepted returned items</td></tr>
            <tr><td style={S.td}>Outstanding</td><td style={S.td}>Sent minus Returned (computed live)</td></tr>
            <tr><td style={S.td}>Status</td><td style={S.td}><strong>In Progress</strong> if outstanding &gt; 0; <strong>Completed</strong> if outstanding = 0</td></tr>
          </tbody>
        </table>
        <div style={S.calloutInfo}>
          Status is computed from live counts — not from a stored value — so it always reflects the most recent return.
        </div>
      </section>

      {/* RECONCILIATION */}
      <section id="reconciliation" style={S.section}>
        <h2 style={S.h2}>Reconciliation</h2>
        <p style={S.p}>
          The <strong>Reconciliation</strong> page shows only batches with outstanding items (In Progress).
          Completed batches do not appear here.
        </p>
        <ul style={S.ul}>
          <li>Each active batch displays its batch code, total sent, total returned, and outstanding count.</li>
          <li>A detail table lists the specific EPC items still outstanding.</li>
          <li>When all items are returned, the batch card disappears and an empty state is shown.</li>
        </ul>
        <div style={S.calloutTip}>
          <strong>Demo moment:</strong> Simulate a partial return (only some items scanned in RETURN session),
          then show Reconciliation highlighting the missing items. Then complete the return and show the batch
          disappear from Reconciliation.
        </div>
      </section>

      {/* TRANSACTION HISTORY */}
      <section id="transaction-history" style={S.section}>
        <h2 style={S.h2}>Transaction History</h2>
        <p style={S.p}>
          The <strong>Transaction History</strong> page provides a chronological log of all RFID session results.
        </p>
        <ul style={S.ul}>
          <li>Each entry shows the session type (STOCK_COUNT, SEND, RETURN), timestamp, batch code (if applicable), and item count.</li>
          <li>Expanding a session shows per-EPC results and validation status.</li>
          <li>Useful for auditing which items were scanned, when, and with what outcome.</li>
        </ul>
      </section>

      {/* DASHBOARD */}
      <section id="dashboard" style={S.section}>
        <h2 style={S.h2}>Dashboard</h2>
        <p style={S.p}>
          The <strong>Dashboard</strong> is the default landing page. It aggregates live counts from
          <code> simulation.db</code> and presents the current state at a glance.
        </p>
        <ul style={S.ul}>
          <li>Total registered linen items</li>
          <li>Active laundry batches (In Progress)</li>
          <li>Total items outstanding across all batches</li>
          <li>Recent scan activity summary</li>
        </ul>
        <div style={S.calloutTip}>
          <strong>Demo opening:</strong> Start every demo session on the Dashboard to immediately show
          the platform has live data and the metrics reflect the current simulation state.
        </div>
      </section>

      {/* RECOMMENDED DEMO SEQUENCE */}
      <section id="demo-flow" style={S.section}>
        <h2 style={S.h2}>Recommended End-to-End Demo Sequence</h2>
        <p style={S.p}>
          Use this sequence for a complete, compelling Simulation Mode demonstration. Total time: approximately
          8–12 minutes.
        </p>
        <Step n={1}><strong>Confirm mode:</strong> Sidebar shows Simulation Mode. Status dot is active.</Step>
        <Step n={2}><strong>Reset data:</strong> Clear Generated Data → Generate Demo Data.</Step>
        <Step n={3}><strong>Open Dashboard:</strong> Show live inventory metrics — items registered, no outstanding batches.</Step>
        <Step n={4}><strong>STOCK_COUNT:</strong> Go to RFID Scan → STOCK_COUNT → select 5–8 linen items → Submit. Show accepted results.</Step>
        <Step n={5}><strong>SEND_TO_LAUNDRY:</strong> RFID Scan → SEND_TO_LAUNDRY → batch code <code>LB-SIM-001</code> → select same items → Submit. Show accepted.</Step>
        <Step n={6}><strong>Check Laundry Batches:</strong> Show batch <code>LB-SIM-001</code> In Progress with correct Sent count.</Step>
        <Step n={7}><strong>Partial RETURN:</strong> RFID Scan → RETURN_FROM_LAUNDRY → batch code <code>LB-SIM-001</code> → select only half the items → Submit.</Step>
        <Step n={8}><strong>Reconciliation (partial):</strong> Show outstanding items still listed under <code>LB-SIM-001</code>.</Step>
        <Step n={9}><strong>Wrong-batch rejection demo:</strong> RFID Scan → RETURN_FROM_LAUNDRY → batch code <code>LB-WRONG</code> → submit. Show WRONG_BATCH results.</Step>
        <Step n={10}><strong>Complete RETURN:</strong> RETURN_FROM_LAUNDRY → <code>LB-SIM-001</code> → remaining items → Submit.</Step>
        <Step n={11}><strong>Reconciliation (resolved):</strong> Batch disappears. Empty state confirmed.</Step>
        <Step n={12}><strong>Transaction History:</strong> Show audit trail of all sessions including rejected ones.</Step>
        <Step n={13}><strong>Dashboard again:</strong> Outstanding count is now zero. Batch count updated.</Step>
      </section>

      {/* CLEANUP */}
      <section id="cleanup" style={S.section}>
        <h2 style={S.h2}>Cleanup and Reset After Demo</h2>
        <Step n={1}>Go to the sidebar Simulation Tools panel.</Step>
        <Step n={2}>Click <strong>Clear Generated Data</strong> to wipe all simulation records.</Step>
        <Step n={3}>Optionally click <strong>Generate Demo Data</strong> to pre-populate for the next session.</Step>
        <div style={S.calloutWarn}>
          <strong>Do not switch to Hardware Mode</strong> immediately after a simulation demo without
          first confirming with the operator whether hardware data should also be cleared or preserved.
          The two databases are isolated — switching modes does not affect simulation data.
        </div>
      </section>
    </div>
  );
}
