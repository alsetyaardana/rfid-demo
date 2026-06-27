"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui";
import { registerPhysicalEpcAction, dismissUnknownEpcAction } from "@/app/actions";

export function HardwareEpcRegistrationPanel({
  recentUnknowns,
  totalLinen,
  limit
}: {
  recentUnknowns: Array<{ epc: string; readerId: string; rssi?: number | null; timestamp: Date; sessionId: string }>;
  totalLinen: number;
  limit: number;
}) {
  const [selectedEpc, setSelectedEpc] = useState<string | null>(null);

  if (recentUnknowns.length === 0 && !selectedEpc) return null;

  return (
    <section className="card" style={{ marginBottom: 24, border: "2px solid var(--gold-400)" }}>
      <div className="card-title">
        <h3>Quick Physical EPC Registration</h3>
        <Badge tone={totalLinen >= limit ? "red" : "gold"}>Hardware Linen: {totalLinen} / {limit}</Badge>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        The following unknown physical EPCs were recently scanned. Register them here to add them to the Linen Master in hardware.db.
      </p>
      
      {selectedEpc ? (
        <RegistrationForm 
          epc={selectedEpc} 
          onCancel={() => setSelectedEpc(null)} 
          disabled={totalLinen >= limit}
        />
      ) : (
        <UnknownEpcsList unknowns={recentUnknowns} onSelect={setSelectedEpc} />
      )}
    </section>
  );
}

function UnknownEpcsList({ unknowns, onSelect }: { unknowns: any[], onSelect: (epc: string) => void }) {
  const [pending, startTransition] = useTransition();

  const handleDismiss = (epc: string) => {
    startTransition(async () => {
      await dismissUnknownEpcAction(epc).catch(e => alert(e.message));
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {unknowns.map((u, i) => (
        <div key={u.epc + i} style={{ display: "flex", gap: "16px", padding: "12px", background: "var(--gray-50)", borderRadius: "8px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{u.epc}</div>
            <div style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginTop: "4px" }}>
              Seen {u.timestamp.toLocaleString()} via {u.readerId} {u.rssi ? `(${u.rssi} dBm)` : ""}
            </div>
          </div>
          <button className="btn secondary" disabled={pending} onClick={() => handleDismiss(u.epc)}>Ignore</button>
          <button className="btn primary" disabled={pending} onClick={() => onSelect(u.epc)}>Register</button>
        </div>
      ))}
    </div>
  );
}

function RegistrationForm({ epc, onCancel, disabled }: { epc: string; onCancel: () => void; disabled: boolean }) {
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
