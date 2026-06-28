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
  calloutDanger: { padding: "12px 16px", borderRadius: "6px", background: "var(--red-soft)", border: "1px solid #f5a0a0", color: "var(--red)", fontSize: "0.9rem", marginBottom: "12px" } as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.9rem" } as const,
  th: { background: "var(--surface-soft)", padding: "8px 12px", textAlign: "left" as const, border: "1px solid var(--line)", fontWeight: 700, color: "var(--navy)" } as const,
  td: { padding: "8px 12px", border: "1px solid var(--line)", color: "var(--text)", verticalAlign: "top" as const } as const,
  ul: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  ol: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  step: { display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" } as const,
  stepNum: { minWidth: "28px", height: "28px", borderRadius: "999px", background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem" } as const,
  badge: (color: string, bg: string) => ({ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, color, background: bg } as const),
};

const tocItems = [
  ["#preparation", "C5 Preparation"],
  ["#connectivity", "API Connectivity"],
  ["#power-profiles", "Power Profiles"],
  ["#epc-registration", "EPC Registration"],
  ["#stock-count", "STOCK_COUNT"],
  ["#send", "SEND_TO_LAUNDRY"],
  ["#return", "RETURN_FROM_LAUNDRY"],
  ["#results", "Accepted and Rejected Results"],
  ["#retry", "Retry Behavior"],
  ["#browser-verify", "Browser Verification"],
  ["#troubleshooting", "Operator Troubleshooting"],
];

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={S.step}>
      <span style={S.stepNum}>{n}</span>
      <span style={{ color: "var(--text)", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export default function HardwareGuide() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Hardware Mode User Guide</h1>
      <p style={S.subtitle}>Chainway C5 E710 + Web Platform — Physical RFID Operations</p>

      <nav style={S.toc} aria-label="Page sections">
        {tocItems.map(([href, label]) => (
          <a key={href} href={href} style={S.tocLink}>{label}</a>
        ))}
      </nav>

      {/* PREPARATION */}
      <section id="preparation" style={S.section}>
        <h2 style={S.h2}>Chainway C5 Preparation</h2>
        <div style={S.calloutDanger}>
          <strong>Stale APK warning:</strong> Always ensure the installed APK was built from the current
          source branch. A stale APK may upload to an incorrect server or use an outdated scan session format.
          If in doubt, rebuild and reinstall from <code>android/chainway-edge-app</code> via
          <code> .\gradlew.bat assembleDebug</code> and sideload the resulting <code>app-debug.apk</code>.
        </div>
        <Step n={1}>Power on the Chainway C5. The app <strong>Porta Nusa Operator</strong> (<code>com.hotel.rfid.edge</code>) should launch automatically or from the app drawer.</Step>
        <Step n={2}>Tap the <strong>Settings</strong> button in the app.</Step>
        <Step n={3}>Confirm the <strong>Server URL</strong> field shows the correct local server address (e.g., <code>http://10.10.101.45:3000</code>).</Step>
        <Step n={4}>Select the desired <strong>Read Range / Power</strong> profile (Near, Medium, or Far). Medium is the default.</Step>
        <Step n={5}>Tap <strong>SAVE CONFIGURATION</strong>. The settings panel closes and the main screen is ready.</Step>
        <div style={S.calloutInfo}>
          The saved Server URL and Power Profile persist across app restarts via SharedPreferences.
          You only need to reconfigure if the server address changes or a different range profile is needed.
        </div>
      </section>

      {/* CONNECTIVITY */}
      <section id="connectivity" style={S.section}>
        <h2 style={S.h2}>API Connectivity Check</h2>
        <p style={S.p}>
          The C5 app uploads to the Web API over the local network. Both the C5 and the server machine
          must be on the same network segment. Confirm connectivity before starting a demo.
        </p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Check</th><th style={S.th}>Pass</th><th style={S.th}>Fail Action</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Web server running</td>
              <td style={S.td}>Browser opens the platform dashboard</td>
              <td style={S.td}>Start the web server: <code>npm run dev</code> in <code>web/</code></td>
            </tr>
            <tr>
              <td style={S.td}>C5 on same network</td>
              <td style={S.td}>Wi-Fi icon visible on C5 status bar</td>
              <td style={S.td}>Connect C5 to the same Wi-Fi SSID as the server</td>
            </tr>
            <tr>
              <td style={S.td}>Server URL correct in app</td>
              <td style={S.td}>Settings shows IP matching the server machine</td>
              <td style={S.td}>Update Server URL in C5 Settings → SAVE CONFIGURATION</td>
            </tr>
            <tr>
              <td style={S.td}>Browser in Hardware Mode</td>
              <td style={S.td}>Sidebar shows Hardware Mode status</td>
              <td style={S.td}>Click Switch Demo Mode in the sidebar</td>
            </tr>
          </tbody>
        </table>
        <div style={S.calloutTip}>
          <strong>Quick connectivity test:</strong> Trigger a STOCK_COUNT scan on the C5 and check the
          Device Activity page in the browser. If the session appears within a few seconds, connectivity
          is confirmed.
        </div>
      </section>

      {/* POWER PROFILES */}
      <section id="power-profiles" style={S.section}>
        <h2 style={S.h2}>RFID Power Profiles (Read Range)</h2>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Profile</th><th style={S.th}>Power (dBm)</th><th style={S.th}>Best For</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><strong>Near</strong></td>
              <td style={S.td}>5</td>
              <td style={S.td}>Scanning one item at a time; demonstrating precise item selection without accidental reads from nearby items</td>
            </tr>
            <tr>
              <td style={S.td}><strong>Medium</strong> (default)</td>
              <td style={S.td}>18</td>
              <td style={S.td}>Standard room-level scanning; daily hotel operations</td>
            </tr>
            <tr>
              <td style={S.td}><strong>Far</strong></td>
              <td style={S.td}>30</td>
              <td style={S.td}>Warehouse or bulk linen cart scanning; widest coverage area</td>
            </tr>
          </tbody>
        </table>
        <ul style={S.ul}>
          <li>Open Settings on the C5 → change the <strong>Read Range / Power</strong> spinner → <strong>SAVE CONFIGURATION</strong>.</li>
          <li>The new profile is applied immediately at the start of the next scan.</li>
          <li>If the RFID module fails to accept the power level, the scan is aborted and <em>Status: FAILED TO SET POWER</em> is displayed. Restart the app or reduce the power profile.</li>
        </ul>
      </section>

      {/* EPC REGISTRATION */}
      <section id="epc-registration" style={S.section}>
        <h2 style={S.h2}>Physical EPC Registration (Unknown Tag Discovery)</h2>
        <p style={S.p}>
          New RFID tags are discovered through a STOCK_COUNT scan. The Web UI handles the registration
          — not the Android app.
        </p>
        <Step n={1}>Trigger a STOCK_COUNT scan on the C5 while the new tag is in range.</Step>
        <Step n={2}>The C5 uploads the session to the Web API. Unrecognized tags are stored as <code>UNKNOWN_EPC</code> in <code>hardware.db</code>.</Step>
        <Step n={3}>Open the <strong>Linen Master</strong> page in the browser (Hardware Mode).</Step>
        <Step n={4}>Within approximately 2.5 seconds, the unknown EPC appears automatically in the registration queue at the top of the page.</Step>
        <Step n={5}>Enter a <strong>Linen Code</strong> and select a <strong>Linen Type</strong> for the tag.</Step>
        <Step n={6}>Click <strong>Register</strong>. The EPC is saved to <code>hardware.db</code> as a recognized linen item.</Step>
        <Step n={7}>On the next C5 scan, the EPC is recognized and returns <code>ACCEPTED</code>.</Step>
        <div style={S.calloutInfo}>
          The Linen Master polling interval is approximately 2.5 seconds. No manual browser refresh is needed.
        </div>
      </section>

      {/* STOCK COUNT */}
      <section id="stock-count" style={S.section}>
        <h2 style={S.h2}>STOCK_COUNT</h2>
        <p style={S.p}>Records the current physical inventory of linen items in the C5&apos;s read range.</p>
        <Step n={1}>On the C5 main screen, confirm the workflow is set to <strong>STOCK_COUNT</strong>.</Step>
        <Step n={2}>Press the physical trigger key (C5 side key) or tap the <strong>START SCAN</strong> button.</Step>
        <Step n={3}>Hold the C5 over the linen items. The antenna reads all tags in range.</Step>
        <Step n={4}>Release the trigger or tap <strong>STOP SCAN</strong>. The app uploads the session automatically.</Step>
        <Step n={5}>Check the <strong>Device Activity</strong> or <strong>Transaction History</strong> page in the browser to confirm the session arrived.</Step>
      </section>

      {/* SEND */}
      <section id="send" style={S.section}>
        <h2 style={S.h2}>SEND_TO_LAUNDRY</h2>
        <p style={S.p}>Dispatches a batch of linen items to the laundry.</p>
        <Step n={1}>On the C5, select workflow <strong>SEND_TO_LAUNDRY</strong>.</Step>
        <Step n={2}>Enter the <strong>batch code</strong> in the batch field (e.g., <code>LB-HW-001</code>). This code uniquely identifies this laundry cycle.</Step>
        <Step n={3}>Trigger the scan over the items being dispatched.</Step>
        <Step n={4}>Stop the scan. The app uploads the session with the batch code.</Step>
        <Step n={5}>Verify in the browser <strong>Laundry Batches</strong> page that the batch appears with the correct Sent count and status <strong>In Progress</strong>.</Step>
        <div style={S.calloutInfo}>
          <strong>Dynamic batch creation:</strong> If the submitted batch code is new, the API creates it automatically.
          Re-submitting the same batch code adds items to the existing batch.
        </div>
      </section>

      {/* RETURN */}
      <section id="return" style={S.section}>
        <h2 style={S.h2}>RETURN_FROM_LAUNDRY</h2>
        <p style={S.p}>Records linen items returned from the laundry against the originating batch.</p>
        <Step n={1}>On the C5, select workflow <strong>RETURN_FROM_LAUNDRY</strong>.</Step>
        <Step n={2}>Enter the <strong>exact same batch code</strong> used during SEND_TO_LAUNDRY.</Step>
        <Step n={3}>Trigger the scan over the items being returned from laundry.</Step>
        <Step n={4}>Stop the scan. The app uploads the session.</Step>
        <Step n={5}>Verify in the browser: outstanding count decreases. If all items returned, batch status changes to <strong>Completed</strong> and the batch disappears from Reconciliation.</Step>
        <div style={S.calloutWarn}>
          <strong>Partial returns are valid.</strong> Returning fewer items than were sent leaves the batch
          In Progress. The outstanding items remain visible in Reconciliation until returned.
        </div>
      </section>

      {/* RESULTS */}
      <section id="results" style={S.section}>
        <h2 style={S.h2}>Accepted and Rejected Results</h2>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Result Code</th><th style={S.th}>Meaning</th><th style={S.th}>Operator Action</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><span style={S.badge("#fff", "var(--teal-dark)")}>ACCEPTED</span></td>
              <td style={S.td}>EPC recognized, batch code matched, not previously processed</td>
              <td style={S.td}>No action needed</td>
            </tr>
            <tr>
              <td style={S.td}><span style={S.badge("#fff", "var(--red)")}>WRONG_BATCH</span></td>
              <td style={S.td}>EPC belongs to a different batch than the one submitted</td>
              <td style={S.td}>Confirm the correct batch code is entered on the C5 before retrying</td>
            </tr>
            <tr>
              <td style={S.td}><span style={S.badge("#fff", "var(--red)")}>ALREADY_RETURNED</span></td>
              <td style={S.td}>This EPC was already returned in a prior session for this batch</td>
              <td style={S.td}>No action needed — item is already reconciled. Do not re-return.</td>
            </tr>
            <tr>
              <td style={S.td}><span style={S.badge("#5a4000", "var(--gold-soft)")}>UNKNOWN_EPC</span></td>
              <td style={S.td}>EPC is not registered in hardware.db</td>
              <td style={S.td}>Register the EPC via Linen Master before including it in a workflow scan</td>
            </tr>
          </tbody>
        </table>
        <div style={S.calloutTip}>
          <strong>Demo moment:</strong> Submit a RETURN with the wrong batch code to demonstrate the
          <code> WRONG_BATCH</code> rejection — this shows the system&apos;s accuracy in preventing
          cross-batch contamination.
        </div>
      </section>

      {/* RETRY */}
      <section id="retry" style={S.section}>
        <h2 style={S.h2}>Retry Behavior</h2>
        <p style={S.p}>
          If an upload fails (network timeout, server unreachable), the C5 app automatically retries.
          The API is idempotent — if the same session ID is submitted more than once, only the first
          submission is processed. Retries will receive a success response without creating duplicate records.
        </p>
        <div style={S.calloutInfo}>
          You can confirm retry safety by checking Transaction History. A retried session appears only once,
          not as multiple entries.
        </div>
      </section>

      {/* BROWSER VERIFICATION */}
      <section id="browser-verify" style={S.section}>
        <h2 style={S.h2}>Browser Verification Steps</h2>
        <p style={S.p}>After each C5 operation, verify the result in the browser (Hardware Mode active):</p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>C5 Operation</th><th style={S.th}>Where to Verify in Browser</th><th style={S.th}>What to Confirm</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>STOCK_COUNT</td>
              <td style={S.td}>Device Activity / Transaction History</td>
              <td style={S.td}>Session appears with correct EPC count and ACCEPTED/UNKNOWN_EPC results</td>
            </tr>
            <tr>
              <td style={S.td}>SEND_TO_LAUNDRY</td>
              <td style={S.td}>Laundry Batches</td>
              <td style={S.td}>Batch code visible, Sent count matches scanned items, Status: In Progress</td>
            </tr>
            <tr>
              <td style={S.td}>RETURN_FROM_LAUNDRY</td>
              <td style={S.td}>Laundry Batches + Reconciliation</td>
              <td style={S.td}>Outstanding count decreased; batch disappears from Reconciliation if fully returned</td>
            </tr>
            <tr>
              <td style={S.td}>Unknown EPC discovery</td>
              <td style={S.td}>Linen Master (Hardware Mode)</td>
              <td style={S.td}>Unknown EPC appears in registration queue within ~2.5 seconds</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* TROUBLESHOOTING */}
      <section id="troubleshooting" style={S.section}>
        <h2 style={S.h2}>Operator Troubleshooting</h2>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Problem</th><th style={S.th}>Resolution</th></tr>
          </thead>
          <tbody>
            {[
              ["C5 shows upload error / connection refused", "Confirm Wi-Fi is connected. Verify Server URL in Settings matches server IP and port. Confirm web server is running."],
              ["Session does not appear in browser after upload", "Confirm browser is in Hardware Mode. Hard-refresh the relevant page. Check Device Activity for the session."],
              ["All results show UNKNOWN_EPC after EPC registration", "Stale APK likely installed. Rebuild APK from current source and reinstall on C5."],
              ["FAILED TO SET POWER error on C5", "Restart the app. Try a lower profile (Near or Medium). If persistent, restart the C5 device."],
              ["WRONG_BATCH rejection on all returned items", "The batch code entered for RETURN does not match the SEND batch code. Re-enter the exact code used during dispatch."],
              ["Unknown EPC not appearing in Linen Master queue", "Confirm Hardware Mode is active in browser. Wait up to 2.5 seconds. Hard-refresh if still missing."],
              ["Scan reads far more items than expected", "Power profile is set to Far. Switch to Near or Medium in C5 Settings for more precise reads."],
              ["App crashes or freezes on C5", "Restart the app. If RFID module errors persist after restart, power-cycle the C5 device."],
            ].map(([problem, resolution]) => (
              <tr key={problem}>
                <td style={S.td}>{problem}</td>
                <td style={S.td}>{resolution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
