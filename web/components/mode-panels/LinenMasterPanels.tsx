"use client";

import { useEffect, useState, useTransition } from "react";
import { registerPhysicalEpcAction, dismissUnknownEpcAction } from "@/app/actions";

const POLL_INTERVAL_MS = 2500;
const HARDWARE_QUEUE_ENDPOINT = "/api/hardware/unknown-epcs";

type UnknownEpcRecord = {
  epc: string;
  readerId: string;
  rssi?: number | null;
  timestamp: Date;
  sessionId: string;
};

type UnknownEpcApiRecord = Omit<UnknownEpcRecord, "timestamp"> & {
  timestamp: string;
};

export function HardwareEpcRegistrationPanel({
  recentUnknowns,
  totalLinen,
  limit
}: {
  recentUnknowns: UnknownEpcRecord[];
  totalLinen: number;
  limit: number;
}) {
  const [selectedEpc, setSelectedEpc] = useState<string | null>(null);
  const [unknowns, setUnknowns] = useState(recentUnknowns);
  const [hardwareLinenCount, setHardwareLinenCount] = useState(totalLinen);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    setUnknowns(recentUnknowns);
  }, [recentUnknowns]);

  useEffect(() => {
    setHardwareLinenCount(totalLinen);
  }, [totalLinen]);

  useEffect(() => {
    let active = true;
    let refreshInFlight = false;

    const refreshQueue = async () => {
      if (refreshInFlight) return;
      refreshInFlight = true;

      try {
        const response = await fetch(HARDWARE_QUEUE_ENDPOINT, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin"
        });

        if (!response.ok) {
          throw new Error("Polling request failed.");
        }

        const payload = await response.json() as {
          recentUnknowns: UnknownEpcApiRecord[];
          totalLinen: number;
        };

        if (!active) return;

        setUnknowns(payload.recentUnknowns.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
        setHardwareLinenCount(payload.totalLinen);
        setPollError(null);
      } catch {
        if (active) {
          setPollError("Live queue update paused. Retrying automatically.");
        }
      } finally {
        refreshInFlight = false;
      }
    };

    const intervalId = window.setInterval(refreshQueue, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (unknowns.length === 0 && !selectedEpc) return null;

  return (
    <section className="card" style={{ marginBottom: 24, border: "2px solid var(--gold-400)" }}>
      <div className="card-title">
        <h3>Quick Physical EPC Registration</h3>
        <span className={`badge ${hardwareLinenCount >= limit ? "red" : "gold"}`}>
          Hardware Linen: {hardwareLinenCount} / {limit}
        </span>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        The following unknown physical EPCs were recently scanned. Register them here to add them to the Linen Master in hardware.db.
      </p>
      {pollError ? (
        <p className="muted" style={{ marginBottom: 16, color: "var(--gold-700)" }}>{pollError}</p>
      ) : null}
      
      {selectedEpc ? (
        <RegistrationForm 
          epc={selectedEpc} 
          onCancel={() => setSelectedEpc(null)} 
          disabled={hardwareLinenCount >= limit}
          onRegistered={(epc) => {
            setSelectedEpc(null);
            setUnknowns((current) => current.filter((item) => item.epc !== epc));
            setHardwareLinenCount((current) => Math.min(current + 1, limit));
          }}
        />
      ) : (
        <UnknownEpcsList
          unknowns={unknowns}
          onSelect={setSelectedEpc}
          onDismissed={(epc) => {
            setUnknowns((current) => current.filter((item) => item.epc !== epc));
          }}
        />
      )}
    </section>
  );
}

function UnknownEpcsList({
  unknowns,
  onSelect,
  onDismissed
}: {
  unknowns: UnknownEpcRecord[];
  onSelect: (epc: string) => void;
  onDismissed: (epc: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleDismiss = (epc: string) => {
    startTransition(async () => {
      await dismissUnknownEpcAction(epc)
        .then(() => onDismissed(epc))
        .catch(e => alert(e.message));
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {unknowns.map((u) => (
        <div key={u.epc} style={{ display: "flex", gap: "16px", padding: "12px", background: "var(--gray-50)", borderRadius: "8px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{u.epc}</div>
            <div style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginTop: "4px" }}>
              Seen {u.timestamp.toLocaleString()} via {u.readerId} {u.rssi != null ? `(${u.rssi} dBm)` : ""} - Session {u.sessionId}
            </div>
          </div>
          <button className="btn secondary" disabled={pending} onClick={() => handleDismiss(u.epc)}>Ignore</button>
          <button className="btn primary" disabled={pending} onClick={() => onSelect(u.epc)}>Register</button>
        </div>
      ))}
    </div>
  );
}

function RegistrationForm({
  epc,
  onCancel,
  disabled,
  onRegistered
}: {
  epc: string;
  onCancel: () => void;
  disabled: boolean;
  onRegistered: (epc: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [linenCode, setLinenCode] = useState("");
  const [linenType, setLinenType] = useState("Bath Towel");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setError(null);
    startTransition(async () => {
      try {
        await registerPhysicalEpcAction(epc, linenCode, linenType);
        onRegistered(epc);
        onCancel();
      } catch (err: any) {
        setError(err.message || "Failed to register.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--gray-50)", padding: "16px", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <strong>Register EPC: <span style={{ fontFamily: "monospace", color: "var(--teal-700)" }}>{epc}</span></strong>
        <span style={{ fontSize: "0.875rem" }}>Status: <strong>AVAILABLE</strong></span>
      </div>
      
      <div className="form-grid" style={{ marginBottom: "16px" }}>
        <div className="field">
          <label>Linen Code</label>
          <input 
            type="text" 
            value={linenCode} 
            onChange={e => setLinenCode(e.target.value)} 
            placeholder="e.g. LN-BATH-001" 
            required 
            disabled={pending || disabled}
          />
        </div>
        <div className="field">
          <label>Linen Type</label>
          <select value={linenType} onChange={e => setLinenType(e.target.value)} disabled={pending || disabled}>
            <option>Bath Towel</option>
            <option>Hand Towel</option>
            <option>Bed Sheet</option>
            <option>Pillowcase</option>
            <option>Duvet Cover</option>
          </select>
        </div>
      </div>

      {error && <div style={{ color: "var(--red-600)", marginBottom: "16px", fontSize: "0.875rem" }}>{error}</div>}
      {disabled && <div style={{ color: "var(--red-600)", marginBottom: "16px", fontSize: "0.875rem" }}>Hardware Linen limit reached (100/100). Cannot register more tags.</div>}

      <div className="button-row">
        <button type="button" className="btn secondary" onClick={onCancel} disabled={pending}>Cancel</button>
        <button type="submit" className="btn primary" disabled={pending || disabled || !linenCode.trim()}>Save Registration</button>
      </div>
    </form>
  );
}
