import { useMemo } from "react";
import { formatCurrency2, formatDateSimple } from "../../utils";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { ReceiptCase as CaseState } from "./useReceiptCase";

/**
 * The case: one receipt, with the exception lines called out against the rest
 * of the basket.
 *
 * The point of the page is to hand loss prevention a finding rather than a
 * search box, and a finding is a specific basket. So the flagged lines are
 * marked and everything else is shown anyway — the unflagged items are the
 * context that makes a void look deliberate or accidental, and hiding them
 * would leave the reader doing the search this page exists to avoid.
 */
interface Props {
  state: CaseState;
  onClose: () => void;
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0 px-3 py-2 text-center border-r border-gray-100 last:border-r-0 flex-1">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
      {label}
    </div>
    <div className="text-[14px] font-bold text-content tabular-nums truncate">
      {value}
    </div>
  </div>
);

const ReceiptCase = ({ state, onClose }: Props) => {
  const { lines, loading, error, saleId, exceptionType } = state;

  const summary = useMemo(() => {
    const flagged = lines.filter((l) => l.sale_type === exceptionType);
    const types = [...new Set(lines.map((l) => l.sale_type))];
    const qty = flagged.reduce((acc, l) => acc + (l.qty ?? 1), 0);
    const value = flagged.reduce((acc, l) => acc + (l.net_sales ?? 0), 0);
    const basket = lines.reduce((acc, l) => acc + (l.net_sales ?? 0), 0);
    return { flagged, types, qty, value, basket };
  }, [lines, exceptionType]);

  const head = lines[0];

  return (
    <div className="absolute inset-0 z-10 bg-custom-white flex flex-col">
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-content truncate">
            {saleId}
          </p>
          <p className="text-[11.5px] text-content/85 truncate">
            {head
              ? `${formatDateSimple(head.sale_date.slice(0, 10))} · lane ${head.terminal || "—"} · ${head.cashier_name}`
              : "Opening receipt…"}
          </p>
        </div>
        <button
          onClick={onClose}
          title="Back to the summary"
          className="flex-shrink-0 p-1 rounded text-content/85 hover:text-content hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="py-8 text-center text-[12px] text-content/85">
          Opening receipt…
        </div>
      )}
      {error && (
        <div className="m-3 px-3 py-2 rounded bg-severity_critical_bg text-[12px] text-severity_critical_text">
          {error}
        </div>
      )}

      {!loading && !error && lines.length > 0 && (
        <>
          <div className="flex-shrink-0 flex border-b border-gray-100 bg-gray-50">
            <Metric
              label={exceptionType}
              value={String(summary.flagged.length)}
            />
            <Metric label="Units" value={String(summary.qty)} />
            <Metric label="Value" value={formatCurrency2(summary.value)} />
            <Metric label="Basket" value={formatCurrency2(summary.basket)} />
            <Metric label="Lines" value={String(lines.length)} />
          </div>

          {summary.types.length > 1 && (
            <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-content/85">
                Also on this receipt:
              </span>
              {summary.types
                .filter((t) => t !== exceptionType)
                .map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-content"
                  >
                    {t}
                  </span>
                ))}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            {lines.map((l) => {
              const flagged = l.sale_type === exceptionType;
              return (
                <div
                  key={`${l.line_number}-${l.product_code}-${l.sale_type}`}
                  className={`flex items-baseline gap-2 px-3 py-1.5 border-b border-gray-100 ${
                    flagged ? "bg-severity_critical_bg" : ""
                  }`}
                >
                  <span className="text-[11px] tabular-nums text-content/85 w-6 flex-shrink-0 text-right">
                    {l.line_number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[12.5px] truncate ${
                        flagged
                          ? "font-medium text-severity_critical_text"
                          : "text-content"
                      }`}
                    >
                      {l.product_description || l.product_code}
                    </span>
                    <span className="block text-[11px] text-content/85 truncate">
                      {l.product_code}
                      {l.price_type ? ` · ${l.price_type}` : ""}
                      {flagged ? ` · ${l.sale_type}` : ""}
                      {l.is_coupon ? " · coupon" : ""}
                      {l.is_discounted ? " · discounted" : ""}
                    </span>
                  </span>
                  <span className="text-[11.5px] tabular-nums text-content/85 w-8 text-right flex-shrink-0">
                    {l.qty ?? 1}
                  </span>
                  <span
                    className={`text-[12px] tabular-nums w-16 text-right flex-shrink-0 ${
                      flagged ? "text-severity_critical_text" : "text-content"
                    }`}
                  >
                    {formatCurrency2(l.net_sales)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ReceiptCase;
