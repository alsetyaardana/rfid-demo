import { displayEnum } from "@/lib/domain/format";

export function Badge({ children }: { children: React.ReactNode }) {
  const text = String(children).toLowerCase();
  const tone = text.includes("outstanding") || text.includes("exception") || text.includes("rejected") || text.includes("wrong") || text.includes("already")
    ? "red"
    : text.includes("pending") || text.includes("active") || text.includes("inspection") || text.includes("reconciliation")
      ? "gold"
      : text.includes("handheld") || text.includes("fixed") || text.includes("simulator")
        ? "navy"
        : "teal";
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Metric({ label, value, note, tone }: { label: string; value: React.ReactNode; note: string; tone?: "teal" | "gold" | "red" }) {
  return (
    <article className={`card metric ${tone ?? ""}`}>
      <label>{label}</label>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function SectionHead({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      {action}
    </div>
  );
}

export function DataTable({ headers, rows, badgeColumns = [] }: { headers: string[]; rows: React.ReactNode[][]; badgeColumns?: number[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={index} className={isMono(cell) ? "mono" : undefined}>
                  {badgeColumns.includes(index) ? <Badge>{renderCell(cell)}</Badge> : renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function enumText(value: string) {
  return displayEnum(value);
}

function renderCell(cell: React.ReactNode) {
  return cell;
}

function isMono(cell: React.ReactNode) {
  return typeof cell === "string" && /^(EPC|LN-|TXN-|SES-|HH-|FX-|SIM-|LB-|AST)/.test(cell);
}
