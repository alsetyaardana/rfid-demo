"use client";

import { useTransition } from "react";
import { resetDemoAction, simulateFixedReaderAction, simulateReturnFromLaundryAction, simulateSendToLaundryAction, simulateUnknownReadAction } from "@/app/actions";

export function ResetDemoButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="btn danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Reset demo data? This deletes generated transactions and RFID sessions, then restores the seed scenario.")) {
          startTransition(async () => resetDemoAction());
        }
      }}
    >
      Reset Demo Data
    </button>
  );
}

export function ScenarioButtons() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="button-row">
      <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => { await simulateSendToLaundryAction(); })}>
        Simulate Send 8
      </button>
      <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => { await simulateReturnFromLaundryAction(); })}>
        Simulate Return 7
      </button>
      <button className="btn secondary" disabled={pending} onClick={() => startTransition(async () => { await simulateUnknownReadAction(); })}>
        Include Unknown EPC
      </button>
      <button className="btn secondary" disabled={pending} onClick={() => startTransition(async () => { await simulateFixedReaderAction(); })}>
        Start Monitoring
      </button>
    </div>
  );
}
