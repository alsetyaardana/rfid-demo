import { DataTable, Metric, SectionHead } from "@/components/ui";
import { enumText } from "@/components/ui";
import { getTransactionHistoryData } from "@/lib/services/queries";

export default async function TransactionHistoryPage() {
  const transactions = await getTransactionHistoryData();
  const accepted = transactions.reduce((sum, transaction) => sum + transaction.items.filter((item) => item.validationStatus === "ACCEPTED").length, 0);
  const rejected = transactions.reduce((sum, transaction) => sum + transaction.items.filter((item) => item.validationStatus !== "ACCEPTED").length, 0);

  return (
    <div className="screen">
      <SectionHead title="Transaction History" body="Confirmed RFID transactions persisted in SQLite. Inventory changes only happen through confirmed transactions." />
      <section className="grid-3">
        <Metric label="Transactions" value={transactions.length} note="Confirmed records" tone="teal" />
        <Metric label="Accepted Items" value={accepted} note="Applied to business workflow" tone="teal" />
        <Metric label="Rejected Items" value={rejected} note="Stored for audit visibility" tone={rejected > 0 ? "red" : "teal"} />
      </section>
      <section className="card tight">
        <DataTable
          headers={["Transaction ID", "Activity", "Batch", "Reader", "Operation Mode", "Accepted", "Rejected", "Timestamp", "Status"]}
          badgeColumns={[4, 8]}
          rows={transactions.map((transaction) => [
            transaction.transactionCode,
            enumText(transaction.transactionType),
            transaction.laundryBatch?.batchCode ?? "-",
            transaction.readerId,
            enumText(transaction.operationMode),
            transaction.items.filter((item) => item.validationStatus === "ACCEPTED").length,
            transaction.items.filter((item) => item.validationStatus !== "ACCEPTED").length,
            transaction.createdAt.toLocaleString(),
            "Confirmed"
          ])}
        />
      </section>
    </div>
  );
}
