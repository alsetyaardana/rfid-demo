import { Badge, DataTable, Metric, SectionHead } from "@/components/ui";
import { enumText } from "@/components/ui";
import { getAssetData } from "@/lib/services/queries";

export default async function AssetManagementPage() {
  const assets = await getAssetData();

  return (
    <div className="screen">
      <SectionHead title="Asset Management" body="Potential expansion use case. This screen does not imply asset management is part of the demonstrated Crowne Plaza linen deployment." action={<Badge>Potential Expansion Use Case</Badge>} />
      <section className="asset-banner">
        <div>
          <strong>Expansion concept only</strong>
          <span>Use this page to show how the same RFID architecture could later support non-linen hotel assets.</span>
        </div>
        <Badge>Not Live Deployment</Badge>
      </section>
      <section className="grid-4">
        <Metric label="Tracked Assets" value={assets.length} note="Seed expansion records" tone="teal" />
        <Metric label="Categories" value={new Set(assets.map((asset) => asset.category)).size} note="Example departments" />
        <Metric label="Inspection Due" value={assets.filter((asset) => asset.currentStatus === "INSPECTION_DUE").length} note="Pending checks" tone="gold" />
        <Metric label="Exceptions" value="0" note="No asset incidents" tone="teal" />
      </section>
      <section className="card tight">
        <DataTable
          headers={["Asset ID", "EPC", "Asset Name", "Category", "Location", "Status"]}
          badgeColumns={[5]}
          rows={assets.map((asset) => [
            asset.assetCode,
            asset.epc,
            asset.assetName,
            asset.category,
            asset.currentLocation.name,
            enumText(asset.currentStatus)
          ])}
        />
      </section>
    </div>
  );
}
