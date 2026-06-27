import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel RFID Operations Platform",
  description: "Website-only functional MVP for hotel linen RFID operations"
};

const navItems = [
  ["/", "Dashboard", "Live linen demo", "M4 13h7V4H4v9ZM13 20h7V4h-7v16ZM4 20h7v-5H4v5Z"],
  ["/rfid-scan", "RFID Scan", "Handheld and fixed reader simulation", "M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M7 12h10M12 7v10"],
  ["/linen-master", "Linen Master", "Registered linen inventory", "M5 7h14M5 12h14M5 17h14M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"],
  ["/laundry-batches", "Laundry Batches", "Dispatch and return batches", "M4 7h16M6 7v12h12V7M9 11h6M9 15h4"],
  ["/reconciliation", "Reconciliation", "Outstanding linen detection", "m4 12 4 4 4-4M8 16V5m12 7-4-4-4 4m4-4v11"],
  ["/device-activity", "Device Activity", "Reader sessions and uploads", "M7 4h10v16H7zM10 18h4M10 7h4M12 11v3"],
  ["/transaction-history", "Transaction History", "Confirmed RFID transactions", "M4 12a8 8 0 1 0 3-6.2M4 5v5h5M12 8v5l3 2"],
  ["/asset-management", "Asset Management", "Potential expansion use case", "M4 8l8-4 8 4-8 4-8-4ZM4 12l8 4 8-4M4 16l8 4 8-4"]
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "/";
  const active = navItems.find(([href]) => href === pathname) ?? navItems[0];

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Primary navigation">
            <div className="brand">
              <div className="brand-mark">RF</div>
              <div>
                <strong>Hotel RFID</strong>
                <span>Operations Platform</span>
              </div>
            </div>
            <nav className="nav-list">
              {navItems.map(([href, label, , path]) => (
                <Link key={href} className={`nav-button ${href === pathname ? "active" : ""}`} href={href}>
                  <span className="nav-icon">
                    <svg viewBox="0 0 24 24"><path d={path} /></svg>
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="sidebar-status">
              <span className="status-dot" />
              <div>
                <strong>Demo environment</strong>
                <span>Website-only MVP</span>
              </div>
            </div>
          </aside>

          <main>
            <header className="topbar">
              <div>
                <p className="eyebrow">{active[2]}</p>
                <h1>{active[1]}</h1>
              </div>
              <div className="topbar-actions">
                <label className="search-box">
                  <span aria-hidden="true">&#8981;</span>
                  <input type="search" placeholder="Search EPC, batch, reader" readOnly />
                </label>
                <div className="operator-chip">
                  <span className="avatar">CP</span>
                  <span>Crowne Plaza Demo</span>
                </div>
              </div>
            </header>
            <section className="content">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
