"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export type DemoMode = "SIMULATION" | "HARDWARE" | null;

interface DemoModeContextType {
  demoMode: DemoMode;
  setDemoMode: (mode: DemoMode) => void;
  switchDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState<DemoMode>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const savedMode = localStorage.getItem("demoMode") as DemoMode;
    if (savedMode === "SIMULATION" || savedMode === "HARDWARE") {
      setDemoModeState(savedMode);
    }
    setMounted(true);
  }, []);

  const setDemoMode = (mode: DemoMode) => {
    if (mode) {
      localStorage.setItem("demoMode", mode);
      document.cookie = `demoMode=${mode}; path=/; max-age=31536000`;
      setDemoModeState(mode);
      window.location.reload();
    } else {
      localStorage.removeItem("demoMode");
      document.cookie = "demoMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setDemoModeState(null);
    }
  };

  const switchDemoMode = () => {
    localStorage.removeItem("demoMode");
    document.cookie = "demoMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setDemoModeState(null);
  };

  if (!mounted) return null; // Avoid hydration mismatch

  const isGuideRoute = pathname?.startsWith("/guides/");

  if (!demoMode && !isGuideRoute) {
    return (
      <div className="welcome-screen">
        <div className="welcome-container">
          <header className="welcome-header">
            <h1>Welcome to Porta Nusa Hotel</h1>
            <p>RFID Linen Visibility Demo</p>
          </header>
          
          <div className="mode-selection">
            <button className="mode-card" onClick={() => setDemoMode("SIMULATION")}>
              <h2>Simulation Mode</h2>
              <ul>
                <li>For users without RFID hardware.</li>
                <li>No physical reader is required.</li>
                <li>Dummy data can be generated manually.</li>
                <li>RFID activity can be simulated.</li>
                <li>Suitable for exploring dashboard, laundry, and reconciliation workflows.</li>
              </ul>
            </button>
            <button className="mode-card" onClick={() => setDemoMode("HARDWARE")}>
              <h2>Hardware Mode</h2>
              <ul>
                <li>For users with the Chainway C5 or compatible RFID hardware.</li>
                <li>Connect the Android handheld app to the server.</li>
                <li>Register the physical EPC tags available for testing.</li>
                <li>Perform real STOCK_COUNT, SEND_TO_LAUNDRY, and RETURN_FROM_LAUNDRY scans.</li>
                <li>No dummy data is generated automatically.</li>
              </ul>
            </button>
          </div>

          <div className="docs-section">
            <h3>Documentation</h3>
            <div className="docs-grid">
              <div className="doc-card">
                <h4>Simulation User Guide</h4>
                <Link href="/guides/simulation" className="btn btn-secondary">Preview</Link>
              </div>
              <div className="doc-card">
                <h4>Hardware User Guide</h4>
                <Link href="/guides/hardware" className="btn btn-secondary">Preview</Link>
              </div>
              <div className="doc-card">
                <h4>System Overview</h4>
                <Link href="/guides/system-overview" className="btn btn-secondary">Preview</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode, switchDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}
