import {
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import type { ScannedRow } from "./present";
import { dateText, money } from "./present";

interface Props {
  row: ScannedRow;
  open: boolean;
  onToggle: () => void;
}

/** Status never rides on color alone: an icon and a word go with it. */
const Verdict = ({ ok, empty }: { ok: boolean; empty: boolean }) =>
  ok ? (
    <span className="flex flex-none items-center gap-1 rounded-full bg-severity_healthy_bg px-2 py-0.5 text-[11px] font-medium text-severity_healthy_text">
      <CheckCircleIcon className="h-3.5 w-3.5" />
      Reconciled
    </span>
  ) : (
    <span className="flex flex-none items-center gap-1 rounded-full bg-severity_watch_bg px-2 py-0.5 text-[11px] font-medium text-severity_watch_text">
      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
      {empty ? "Nothing to check" : "To check"}
    </span>
  );

const Total = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex items-baseline justify-between gap-6 text-[12px]">
      <span className="text-content/85">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  ) : null;

/**
 * One invoice, closed to a line that says whether it balances and open to
 * everything that was read off it.
 *
 * Read-only. The figures are what the model transcribed, and the checks are
 * the server's verdict on them; a line whose extended amount follows from
 * neither qty × price nor qty × (price − allowance) is marked, because that
 * is the row most likely to have been misread.
 */
const ScannedInvoiceCard = ({ row, open, onToggle }: Props) => {
  const { invoice, reconcile } = row;
  const t = invoice.totals ?? ({} as Partial<typeof invoice.totals>);
  const flagged = row.lineFlags.filter(Boolean).length;
  const credit = (t.invoiceTotal ?? "").trim().startsWith("-");

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-custom-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-bkg"
      >
        <ChevronDownIcon
          className={`h-4 w-4 flex-none text-content/85 transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-display text-[14px] font-bold text-content">
              {invoice.vendor || "Unknown vendor"}
            </span>
            <span className="font-mono text-[11.5px] text-content/85">
              #{invoice.invoiceNumber}
            </span>
            {credit && (
              <span className="rounded bg-bkg px-1.5 text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Credit
              </span>
            )}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-content/85">
            {dateText(invoice.invoiceDate)}
            {invoice.storeName ? ` · ${invoice.storeName}` : ""}
            {invoice.storeNumber ? ` #${invoice.storeNumber}` : ""} ·{" "}
            {invoice.lines.length}{" "}
            {invoice.lines.length === 1 ? "line" : "lines"}
            {invoice.pages ? ` · pages ${invoice.pages}` : ""}
            {row.file ? ` · ${row.file}` : ""}
          </div>
        </div>
        {flagged > 0 && (
          <span
            className="flex-none text-[11px] text-severity_watch_text"
            title="Lines whose amount doesn't follow from their quantity and price"
          >
            {flagged} line{flagged === 1 ? "" : "s"} to look at
          </span>
        )}
        <span className="w-24 flex-none text-right font-mono text-[13px] font-semibold tabular-nums">
          {money(t.invoiceTotal)}
        </span>
        <Verdict
          ok={row.reconciled}
          empty={(reconcile?.checks.length ?? 0) === 0}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-gray-100 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                  <th className="px-3.5 py-2 font-normal">#</th>
                  <th className="px-2 py-2 font-normal">Description</th>
                  <th className="px-2 py-2 font-normal">Item code</th>
                  <th className="px-2 py-2 font-normal">UPC</th>
                  <th className="px-2 py-2 text-right font-normal">Qty</th>
                  <th className="px-2 py-2 text-right font-normal">Unit cost</th>
                  <th className="px-2 py-2 text-right font-normal">Allowance</th>
                  <th className="px-3.5 py-2 text-right font-normal">Ext</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, i) => {
                  const off = row.lineFlags[i];
                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 last:border-b-0 ${
                        off ? "bg-severity_watch_bg" : ""
                      }`}
                    >
                      <td className="px-3.5 py-1.5 font-mono text-[11px] text-content/85">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1.5">{line.description || "—"}</td>
                      <td className="px-2 py-1.5 font-mono text-[11px]">
                        {line.itemCode || "—"}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[11px]">
                        {line.upc || "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {line.qty}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {money(line.unitPrice)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {money(line.allowance)}
                      </td>
                      <td
                        className="px-3.5 py-1.5 text-right font-mono tabular-nums"
                        title={
                          off
                            ? "Doesn't equal qty × unit cost, with or without the allowance — check it against the scan"
                            : undefined
                        }
                      >
                        {off && (
                          <ExclamationTriangleIcon className="mr-1 inline h-3.5 w-3.5 text-severity_watch_text" />
                        )}
                        {money(line.ext)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 border-t border-gray-100 px-3.5 py-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <div className="pb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Printed totals
              </div>
              <Total label="Subtotal" value={t.subtotal} />
              <Total label="Discount" value={t.discount} />
              <Total label="Credits" value={t.credits} />
              <Total label="Deposit" value={t.deposit} />
              <Total label="Fees & tax" value={t.serviceFee} />
              <div className="mt-1 border-t border-gray-100 pt-1">
                <Total label="Invoice total" value={t.invoiceTotal} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="pb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Reconciliation
              </div>
              {(reconcile?.checks ?? []).map((check) => (
                <div
                  key={check.label}
                  className="flex items-center gap-2 text-[12px]"
                >
                  {check.ok ? (
                    <CheckCircleIcon className="h-4 w-4 flex-none text-severity_healthy_text" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 flex-none text-severity_watch_text" />
                  )}
                  <span className="min-w-0 flex-1">{check.label}</span>
                  <span className="font-mono tabular-nums text-content/85">
                    {check.derived}
                    {check.ok ? " = " : " ≠ "}
                    {check.reported}
                  </span>
                </div>
              ))}
              {(reconcile?.checks.length ?? 0) === 0 && (
                <p className="text-[12px] text-content/85">
                  The server had nothing to check this invoice against.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ScannedInvoiceCard;
