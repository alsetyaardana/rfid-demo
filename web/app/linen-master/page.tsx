import { DataTable, Metric, SectionHead } from "@/components/ui";
import { enumText } from "@/components/ui";
import { getLinenMasterData } from "@/lib/services/queries";

export default async function LinenMasterPage() {
  const linens = await getLinenMasterData();
  const available = linens.filter((linen) => linen.currentStatus === "AVAILABLE").length;
  const inLaundry = linens.filter((linen) => linen.currentStatus === "IN_LAUNDRY").length;
  const dirty = linens.filter((linen) => linen.currentStatus === "DIRTY").length;
  const outstanding = linens.filter((linen) => linen.currentStatus === "OUTSTANDING").length;

  return (
    <div className="screen">
      <SectionHead title="Linen Master" body="Registered linen inventory with unique EPC values, current status, location, and laundry cycle counts." />
      <section className="grid-4">
        <Metric label="Available" value={available} note="Ready for operations" tone="teal" />
        <Metric label="In Laundry" value={inLaundry} note="Updated by confirmed sends" tone="gold" />
        <Metric label="Dirty" value={dirty} note="Pending laundry processing" tone="gold" />
        <Metric label="Outstanding" value={outstanding} note="Current linen status records" tone={outstanding > 0 ? "red" : "teal"} />
      </section>
      <section className="card tight">
        <DataTable
          headers={["Linen ID", "EPC", "Linen Type", "Status", "Location", "Laundry Cycles", "Last Scanned"]}
          badgeColumns={[3]}
          rows={linens.map((linen) => [
            linen.linenCode,
            linen.epc,
            linen.linenType,
            enumText(linen.currentStatus),
            linen.currentLocation.name,
            linen.laundryCycleCount,
            linen.lastScannedAt ? linen.lastScannedAt.toLocaleString() : "-"
          ])}
        />
      </section>
    </div>
  );
}
