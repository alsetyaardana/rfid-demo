"use client";

import { useState, useTransition } from "react";
import { resetDemoAction, clearDemoAction, generateDemoAction, simulateFixedReaderAction, simulateReturnFromLaundryAction, simulateSendToLaundryAction, simulateUnknownReadAction } from "@/app/actions";

export function GenerateDataForm() {
  const [pending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(20);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await generateDemoAction(quantity);
      } catch (err: any) {
        setError(err.message || "Failed to generate data.");
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
      <input 
        type="number" 
        min={1} 
        max={100} 
        value={quantity} 
        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} 
        disabled={pending}
        style={{ width: "80px" }}
      />
      <button className="btn primary" disabled={pending || quantity <= 0} onClick={handleGenerate}>
        Generate Demo Data
      </button>
      {error && <span style={{ color: "var(--red-600)", fontSize: "0.875rem" }}>{error}</span>}
    </div>
  );
}

export function ClearDataButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="btn secondary"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Clear all simulation operational data? Locations will be preserved.")) {
          startTransition(async () => clearDemoAction());
        }
      }}
    >
      Clear Generated Data
    </button>
  );
}

export function ResetDemoButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="btn danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm("RESET SIMULATION? This wipes everything and restores base locations only.")) {
          startTransition(async () => resetDemoAction());
        }
      }}
    >
      Reset Database
    </button>
  );
}

export function ScenarioButtons() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="button-row">
      <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => { await simulateSendToLaundryAction().catch(e => alert(e.message)); })}>
        Simulate Send
      </button>
      <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => { await simulateReturnFromLaundryAction().catch(e => alert(e.message)); })}>
        Simulate Return
      </button>
      <button className="btn secondary" disabled={pending} onClick={() => startTransition(async () => { await simulateUnknownReadAction().catch(e => alert(e.message)); })}>
        Include Unknown EPC
      </button>
      <button className="btn secondary" disabled={pending} onClick={() => startTransition(async () => { await simulateFixedReaderAction().catch(e => alert(e.message)); })}>
        Start Monitoring
      </button>
    </div>
  );
}
