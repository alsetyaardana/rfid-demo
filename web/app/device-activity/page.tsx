import { DataTable, Metric, SectionHead } from "@/components/ui";
import { enumText } from "@/components/ui";
import { getDeviceActivityData } from "@/lib/services/queries";
import { headers } from "next/headers";

export default async function DeviceActivityPage() {
  const mode = headers().get("x-demo-mode") || "SIMULATION";
  const isHardware = mode === "HARDWARE";

  const sessions = await getDeviceActivityData();
  const totalTags = sessions.reduce((sum, session) => sum + session.uniqueTagCount, 0);

  return (
    <div className="screen">
      <SectionHead title="Device Activity" body="Reader session telemetry with reader type, operation mode, checkpoint, upload status, and stored reads." />
      <section className={isHardware ? "grid-2" : "grid-4"}>
        <Metric label="Sessions" value={sessions.length} note="Persisted RFID read sessions" tone="teal" />
        <Metric label="Unique Tags" value={totalTags} note="Across stored sessions" />
        {!isHardware && (
          <>
            <Metric label="Emulator Sessions" value={sessions.filter((s) => s.readerType === "FIXED_READER_EMULATOR").length} note="Website-level fixed reader" tone="gold" />
            <Metric label="Simulator Sessions" value={sessions.filter((s) => s.readerType === "SIMULATOR").length} note="Website simulation source" />
          </>
        )}
      </section>
      {sessions.length === 0 ? (
        <section className="empty-state">
          <h3>No device activity found</h3>
          <p>Connect a physical Chainway C5 device to send sessions to the database.</p>
        </section>
      ) : (
        <section className="card tight">
          <DataTable
            headers={["Timestamp", "Reader ID", "Reader Type", "Operation Mode", "Checkpoint", "Session ID", "Unique Tags", "Upload Status"]}
            badgeColumns={[2, 3, 7]}
            rows={sessions.map((session) => [
              session.createdAt.toLocaleString(),
              session.readerId,
              enumText(session.readerType),
              enumText(session.operationMode),
              session.checkpoint,
              session.clientSessionId,
              session.uniqueTagCount,
              session.readerType === "FIXED_READER_EMULATOR" ? "Auto Upload Active" : "Uploaded"
            ])}
          />
        </section>
      )}
    </div>
  );
}
