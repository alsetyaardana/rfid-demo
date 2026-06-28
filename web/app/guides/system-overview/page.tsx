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
  card: {
    padding: "16px 20px", borderRadius: "8px",
    border: "1px solid var(--line)", background: "var(--surface)",
    marginBottom: "12px",
  } as const,
  calloutInfo: {
    padding: "12px 16px", borderRadius: "6px",
    background: "var(--blue-soft)", border: "1px solid #b3cef5",
    color: "var(--navy)", fontSize: "0.9rem", marginBottom: "12px",
  } as const,
  calloutWarn: {
    padding: "12px 16px", borderRadius: "6px",
    background: "var(--gold-soft)", border: "1px solid #e0c840",
    color: "#5a4000", fontSize: "0.9rem", marginBottom: "12px",
  } as const,
  calloutDanger: {
    padding: "12px 16px", borderRadius: "6px",
    background: "var(--red-soft)", border: "1px solid #f5a0a0",
    color: "var(--red)", fontSize: "0.9rem", marginBottom: "12px",
  } as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.9rem" } as const,
  th: { background: "var(--surface-soft)", padding: "8px 12px", textAlign: "left" as const, border: "1px solid var(--line)", fontWeight: 700, color: "var(--navy)" } as const,
  td: { padding: "8px 12px", border: "1px solid var(--line)", color: "var(--text)", verticalAlign: "top" as const } as const,
  badge: (color: string) => ({
    display: "inline-block", padding: "2px 8px", borderRadius: "999px",
    fontSize: "0.75rem", fontWeight: 700, background: color, color: "#fff",
  } as const),
  ul: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  ol: { paddingLeft: "20px", color: "var(--text)", lineHeight: 1.7, margin: "0 0 12px" } as const,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" } as const,
};

const tocItems = [
  ["#purpose", "Purpose"],
  ["#architecture", "Architecture"],
  ["#modes", "Simulation & Hardware Modes"],
  ["#database", "Database Isolation"],
  ["#workflows", "RFID Workflows"],
  ["#batch", "Batch & Reconciliation"],
  ["#power", "Power Profiles"],
  ["#verification", "Verification Matrix"],
  ["#limitations", "Known Limitations"],
  ["#troubleshooting", "Troubleshooting"],
];

export default function SystemOverviewGuide() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>System Overview — Technical Documentation</h1>
      <p style={S.subtitle}>Porta Nusa Hotel · RFID Linen Visibility Platform · Branch: android-integration</p>

      {/* Table of Contents */}
      <nav style={S.toc} aria-label="Page sections">
        {tocItems.map(([href, label]) => (
          <a key={href} href={href} style={S.tocLink}>{label}</a>
        ))}
      </nav>

      {/* PURPOSE */}
      <section id="purpose" style={S.section}>
        <h2 style={S.h2}>Purpose</h2>
        <p style={S.p}>
          The Porta Nusa Hotel RFID Linen Visibility Platform tracks hotel linen items through their lifecycle —
          stock count, dispatch to laundry, and return from laundry — using RFID tags and a Chainway C5 handheld reader.
          The platform provides real-time inventory visibility, laundry batch reconciliation, and transaction history
          from a browser-based management interface. It is designed as a functional MVP for presales demonstration and
          structured operator evaluation, not yet deployed to production.
        </p>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" style={S.section}>
        <h2 style={S.h2}>High-Level Architecture</h2>
        <div style={S.grid2}>
          <div style={S.card}>
            <strong>Web Application</strong>
            <p style={{ ...S.p, marginTop: "8px" }}>Next.js 14 (App Router). Serves the management UI and all API routes. Reads the active mode from the <code>X-Demo-Mode</code> HTTP header injected by client middleware.</p>
          </div>
          <div style={S.card}>
            <strong>Android Application</strong>
            <p style={{ ...S.p, marginTop: "8px" }}>Chainway C5 E710 handheld running a purpose-built Android app. Triggers physical RFID inventory scans and uploads session results to the Web API.</p>
          </div>
          <div style={S.card}>
            <strong>RFID Tags</strong>
            <p style={{ ...S.p, marginTop: "8px" }}>UHF RFID tags sewn into linen items. Each tag carries a unique EPC (Electronic Product Code) read by the C5 antenna.</p>
          </div>
          <div style={S.card}>
            <strong>Persistence Layer</strong>
            <p style={{ ...S.p, marginTop: "8px" }}>Two isolated SQLite databases managed by Prisma ORM. <code>simulation.db</code> for browser demos; <code>hardware.db</code> for physical device operations. No shared state between them.</p>
          </div>
        </div>

        <h3 style={S.h3}>Data Flow</h3>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Client</th>
              <th style={S.th}>Header Injected</th>
              <th style={S.th}>Database Written</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Browser (Simulation Mode)</td>
              <td style={S.td}><code>X-Demo-Mode: SIMULATION</code></td>
              <td style={S.td}><code>simulation.db</code></td>
            </tr>
            <tr>
              <td style={S.td}>Browser (Hardware Mode)</td>
              <td style={S.td}><code>X-Demo-Mode: HARDWARE</code></td>
              <td style={S.td}><code>hardware.db</code></td>
            </tr>
            <tr>
              <td style={S.td}>Chainway C5 Android App</td>
              <td style={S.td}><code>X-Demo-Mode: HARDWARE</code> (always)</td>
              <td style={S.td}><code>hardware.db</code></td>
            </tr>
          </tbody>
        </table>

        <h3 style={S.h3}>Key Technologies</h3>
        <ul style={S.ul}>
          <li><strong>Next.js 14</strong> — App Router, server components, API route handlers</li>
          <li><strong>Prisma ORM</strong> — type-safe database access, two datasource instances</li>
          <li><strong>SQLite</strong> — embedded, file-based, no external database server required</li>
          <li><strong>Chainway C5 E710</strong> — Android 9 handheld with integrated UHF RFID module</li>
          <li><strong>Kotlin / Android SDK</strong> — native Android app, RFID SDK via <code>RFIDWithUHFUART</code></li>
          <li><strong>TypeScript</strong> — strict typing across web codebase</li>
        </ul>
      </section>

      {/* MODES */}
      <section id="modes" style={S.section}>
        <h2 style={S.h2}>Simulation Mode and Hardware Mode</h2>
        <p style={S.p}>
          The platform operates in two completely isolated modes. The browser operator selects the active mode via the
          sidebar toggle. Mode selection changes which database all subsequent reads and writes target. There is no
          migration or data transfer between modes.
        </p>
        <div style={S.grid2}>
          <div style={{ ...S.card, borderTop: "3px solid var(--teal)" }}>
            <strong style={{ color: "var(--teal)" }}>Simulation Mode</strong>
            <p style={{ ...S.p, marginTop: "8px" }}>
              Browser operators work with seeded synthetic data. No physical hardware required. Simulation data
              is generated, cleared, and reset from the Dashboard&apos;s Simulation Data Management section. Reads from
              and writes to <code>simulation.db</code>.
            </p>
          </div>
          <div style={{ ...S.card, borderTop: "3px solid var(--navy)" }}>
            <strong style={{ color: "var(--navy)" }}>Hardware Mode</strong>
            <p style={{ ...S.p, marginTop: "8px" }}>
              Real RFID scan data is uploaded by the Chainway C5. The browser monitors results and manages EPC
              registration. Reads from and writes to <code>hardware.db</code>. The C5 always sends
              <code> X-Demo-Mode: HARDWARE</code> regardless of browser state.
            </p>
          </div>
        </div>
        <div style={S.calloutInfo}>
          <strong>Mode Header:</strong> Browser mode is propagated via Next.js middleware that reads a cookie and
          attaches the appropriate <code>X-Demo-Mode</code> header to every server request within the session.
        </div>
      </section>

      {/* DATABASE ISOLATION */}
      <section id="database" style={S.section}>
        <h2 style={S.h2}>Database Isolation</h2>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Property</th>
              <th style={S.th}>simulation.db</th>
              <th style={S.th}>hardware.db</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Location</td>
              <td style={S.td}><code>web/prisma/simulation.db</code></td>
              <td style={S.td}><code>web/prisma/hardware.db</code></td>
            </tr>
            <tr>
              <td style={S.td}>Populated by</td>
              <td style={S.td}>Dashboard simulation data-management actions and seed script</td>
              <td style={S.td}>Chainway C5 Android uploads only</td>
            </tr>
            <tr>
              <td style={S.td}>Linen item cap</td>
              <td style={S.td}>100 (enforced)</td>
              <td style={S.td}>100 (enforced)</td>
            </tr>
            <tr>
              <td style={S.td}>Reset / seed</td>
              <td style={S.td}>Via Dashboard Simulation Data Management</td>
              <td style={S.td}>Manual (no UI reset in this MVP)</td>
            </tr>
            <tr>
              <td style={S.td}>Shared state</td>
              <td colSpan={2} style={{ ...S.td, textAlign: "center", color: "var(--red)", fontWeight: 700 }}>None — completely isolated</td>
            </tr>
          </tbody>
        </table>
        <div style={S.calloutDanger}>
          <strong>Do not commit runtime database files.</strong> <code>simulation.db</code>, <code>hardware.db</code>,
          and their WAL/SHM journal files contain live operational data and must never be checked into Git.
        </div>
      </section>

      {/* WORKFLOWS */}
      <section id="workflows" style={S.section}>
        <h2 style={S.h2}>RFID Workflows</h2>

        <h3 style={S.h3}>Physical EPC Registration Flow (Hardware Mode)</h3>
        <p style={S.p}>Registration is Web-first. The Android app is used only to discover unknown EPCs.</p>
        <ol style={S.ol}>
          <li>Operator triggers RFID scan on Chainway C5 (side key or UI button).</li>
          <li>Android app uploads session payload to <code>POST /api/rfid/read-sessions</code> with <code>X-Demo-Mode: HARDWARE</code>.</li>
          <li>API stores items with <code>validationStatus: UNKNOWN_EPC</code> in <code>hardware.db</code>.</li>
          <li>Hardware Linen Master UI polls <code>GET /api/hardware/unknown-epcs</code> every 2.5 seconds.</li>
          <li>Unknown EPC appears automatically in the Web registration queue — no manual browser refresh required.</li>
          <li>Operator assigns Linen Code and Linen Type in the browser and saves.</li>
          <li>Next C5 scan recognizes the EPC as a registered item.</li>
        </ol>

        <h3 style={S.h3}>STOCK_COUNT</h3>
        <p style={S.p}>
          Records the current physical count of linen items in a location. The C5 scans all tags in range
          and uploads a session. Each scanned EPC is matched against the linen registry. Registered EPCs
          produce <code>ACCEPTED</code> results; unregistered EPCs produce <code>UNKNOWN_EPC</code>.
          RSSI and read count are captured per tag.
        </p>

        <h3 style={S.h3}>SEND_TO_LAUNDRY</h3>
        <p style={S.p}>
          Dispatches a batch of linen items to the laundry. The operator specifies a batch code on the C5
          before scanning. The API finds or creates a laundry batch using the exact submitted batch code —
          no hardcoded batch dependency. Each scanned EPC in the batch is recorded as a sent item.
        </p>

        <h3 style={S.h3}>RETURN_FROM_LAUNDRY</h3>
        <p style={S.p}>
          Records the return of linen items from the laundry. The submitted batch code must match the
          originating send batch exactly. Returns are validated per-EPC per-batch:
        </p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Result Code</th><th style={S.th}>Meaning</th></tr>
          </thead>
          <tbody>
            <tr><td style={S.td}><code>ACCEPTED</code></td><td style={S.td}>EPC matched the correct batch and was not previously returned.</td></tr>
            <tr><td style={S.td}><code>WRONG_BATCH</code></td><td style={S.td}>EPC belongs to a different batch code than submitted.</td></tr>
            <tr><td style={S.td}><code>ALREADY_RETURNED</code></td><td style={S.td}>EPC was already returned in a prior session for this batch.</td></tr>
            <tr><td style={S.td}><code>UNKNOWN_EPC</code></td><td style={S.td}>EPC is not registered in the hardware linen registry.</td></tr>
          </tbody>
        </table>

        <h3 style={S.h3}>Retry and Idempotency</h3>
        <p style={S.p}>
          All write operations are idempotent by session ID. If the C5 retries an upload due to a network
          interruption, the server detects the duplicate session and returns a success response without
          creating duplicate records. This prevents double-counting on flaky connections.
        </p>
      </section>

      {/* BATCH & RECONCILIATION */}
      <section id="batch" style={S.section}>
        <h2 style={S.h2}>Dynamic Batch Creation and Reconciliation</h2>

        <h3 style={S.h3}>Batch Rules</h3>
        <ul style={S.ul}>
          <li>Every submitted batch code is independent — no hardcoded reference batch exists.</li>
          <li><code>SEND_TO_LAUNDRY</code> safely find-or-creates the batch using the exact submitted code.</li>
          <li><code>outstanding = acceptedSent − validReturned</code> computed live per batch.</li>
          <li><code>outstanding &gt; 0</code> → batch status is <strong>In Progress</strong>.</li>
          <li><code>outstanding = 0</code> and <code>acceptedSent &gt; 0</code> → batch status is <strong>Completed</strong>.</li>
          <li>Completed batches disappear from the Reconciliation view automatically.</li>
        </ul>

        <h3 style={S.h3}>Reconciliation Calculation</h3>
        <p style={S.p}>
          Reconciliation uses a count-per-EPC map, not a simple Set. This correctly handles scenarios where
          the same EPC tag was sent multiple times across separate laundry cycles — each return credit is
          consumed individually against the matching sent record for that EPC in that batch.
        </p>
      </section>

      {/* POWER PROFILES */}
      <section id="power" style={S.section}>
        <h2 style={S.h2}>RFID Power Profiles (Read Range Control)</h2>
        <p style={S.p}>
          The Chainway C5 operator can select a power profile before each scan. Profile selection persists
          across app restarts via SharedPreferences. The profile is applied immediately before every
          <code> startInventoryTag()</code> call. If <code>setPower()</code> fails, the scan is aborted
          and an error status is displayed.
        </p>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Profile</th><th style={S.th}>Power (dBm)</th><th style={S.th}>Typical Use</th></tr>
          </thead>
          <tbody>
            <tr><td style={S.td}><strong>Near</strong></td><td style={S.td}>5</td><td style={S.td}>Precise single-item scanning; minimizes accidental reads</td></tr>
            <tr><td style={S.td}><strong>Medium</strong> (default)</td><td style={S.td}>18</td><td style={S.td}>Standard room-level scanning; balanced range and accuracy</td></tr>
            <tr><td style={S.td}><strong>Far</strong></td><td style={S.td}>30</td><td style={S.td}>Wide-area coverage; warehouse or bulk linen carts</td></tr>
          </tbody>
        </table>
        <div style={S.calloutInfo}>
          Profile is saved only when the operator explicitly taps <strong>SAVE CONFIGURATION</strong>
          in the Android Settings panel. Changing the spinner without saving does not persist.
        </div>
      </section>

      {/* VERIFICATION MATRIX */}
      <section id="verification" style={S.section}>
        <h2 style={S.h2}>Verification Matrix</h2>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Capability</th>
              <th style={S.th}>Highest Level Achieved</th>
              <th style={S.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Core Web UI and API", "BROWSER VERIFIED", "All 8 routes operational"],
              ["Simulation Mode isolation", "BROWSER VERIFIED", "simulation.db confirmed isolated"],
              ["Hardware Mode isolation", "BROWSER VERIFIED", "hardware.db confirmed isolated"],
              ["STOCK_COUNT (physical)", "PHYSICALLY VERIFIED", "C5 upload confirmed in hardware.db"],
              ["SEND_TO_LAUNDRY (physical)", "PHYSICALLY VERIFIED", "Dynamic batch creation confirmed"],
              ["RETURN_FROM_LAUNDRY (physical)", "PHYSICALLY VERIFIED", "Wrong-batch and already-returned rejections confirmed"],
              ["Dynamic batch reconciliation", "PHYSICALLY VERIFIED", "17/17 automated assertions + physical validation"],
              ["Web-first EPC registration", "PHYSICALLY VERIFIED", "Unknown EPC appeared in browser polling queue"],
              ["RFID power profiles (Near/Med/Far)", "PHYSICALLY VERIFIED", "Physical range comparison + persistence after restart"],
              ["Retry / idempotency", "AUTOMATED TESTED", "17/17 assertions; no physical duplicate session test"],
              ["Production deployment", "NOT VERIFIED", "Docker / Cloudflare deployment not yet performed"],
            ].map(([cap, level, note]) => (
              <tr key={cap}>
                <td style={S.td}>{cap}</td>
                <td style={S.td}>
                  <span style={S.badge(
                    level === "PHYSICALLY VERIFIED" ? "var(--teal-dark)" :
                    level === "BROWSER VERIFIED" ? "var(--navy)" :
                    level === "AUTOMATED TESTED" ? "var(--gold)" :
                    "var(--red)"
                  )}>{level}</span>
                </td>
                <td style={S.td}>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* KNOWN LIMITATIONS */}
      <section id="limitations" style={S.section}>
        <h2 style={S.h2}>Known Limitations</h2>
        <ul style={S.ul}>
          <li><strong>No production deployment.</strong> The platform runs on a local development server. No Docker image or Cloudflare configuration has been applied yet.</li>
          <li><strong>No APK download portal.</strong> The Android APK must be sideloaded from a build workstation. There is no in-app APK distribution mechanism in this MVP.</li>
          <li><strong>No hardware.db reset UI.</strong> Clearing hardware data requires manual database file replacement. Simulation data can be reset from the browser.</li>
          <li><strong>No multi-user sessions.</strong> The platform has no authentication layer. A single operator context is assumed per browser session.</li>
          <li><strong>Fixed server URL.</strong> The C5 app target server URL (<code>http://10.10.101.45:3000</code>) is configured in the Android Settings panel and must be set manually per deployment environment.</li>
          <li><strong>min-width 1280px.</strong> The browser UI is designed for desktop/tablet. Narrow mobile viewports may require horizontal scrolling.</li>
          <li><strong>Linen item cap at 100.</strong> Both databases enforce a hard cap of 100 registered linen items as a safe MVP limit.</li>
        </ul>
      </section>

      {/* TROUBLESHOOTING */}
      <section id="troubleshooting" style={S.section}>
        <h2 style={S.h2}>Technical Troubleshooting</h2>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Symptom</th><th style={S.th}>Likely Cause</th><th style={S.th}>Resolution</th></tr>
          </thead>
          <tbody>
            {[
              [
                "C5 upload shows \"Connection Refused\" or times out",
                "Server not running, wrong IP, or firewall blocking port 3000",
                "Confirm web server is running. Verify C5 Settings URL matches server IP. Ensure both devices are on the same network segment.",
              ],
              [
                "Hardware scan data not appearing in browser",
                "Browser is in Simulation Mode or stale APK installed on C5",
                "Switch browser to Hardware Mode. Rebuild and reinstall APK from current source if data still missing.",
              ],
              [
                "Unknown EPC not appearing in registration queue",
                "Browser polling paused or in wrong mode",
                "Confirm Hardware Mode is active. Wait up to 2.5 seconds. Hard-refresh if queue remains empty.",
              ],
              [
                "\"FAILED TO SET POWER\" on C5",
                "RFID hardware module failed to accept power value",
                "Restart the C5 app. Try a lower power profile (Near). If persistent, restart the device.",
              ],
              [
                "RETURN_FROM_LAUNDRY returns WRONG_BATCH",
                "Batch code on C5 does not match the send batch code",
                "Confirm the exact batch code entered on the C5 matches the batch code used during SEND_TO_LAUNDRY.",
              ],
              [
                "Reconciliation shows a batch that should be completed",
                "Outstanding count is not yet zero — partial return recorded",
                "Scan and return the remaining outstanding items. Batch disappears when outstanding reaches 0.",
              ],
              [
                "TypeScript or Next.js build errors after source change",
                "Type mismatch or missing import",
                "Run `npx tsc --noEmit` in the `web/` directory to identify the error. Do not deploy a build with type errors.",
              ],
            ].map(([symptom, cause, res]) => (
              <tr key={symptom}>
                <td style={S.td}>{symptom}</td>
                <td style={S.td}>{cause}</td>
                <td style={S.td}>{res}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
