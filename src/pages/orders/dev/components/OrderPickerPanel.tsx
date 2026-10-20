import { useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import type { OrderDoc } from "../orderEdit";

interface Props {
  /** Every order in the range, newest first. */
  docs: OrderDoc[];
  /** The one being edited, if any. */
  openKey: string | null;
  onPick: (doc: OrderDoc) => void;
  storeNumber: string;
  orderDate: string;
  onStore: (value: string) => void;
  onDate: (value: string) => void;
  onClear: () => void;
  onOpenSearch: () => void;
  /** Held while a draft has unsaved changes, so a click cannot discard them. */
  blocked: boolean;
  startDate: string;
  endDate: string;
  scopeLabel: string;
}

/** The same three-digit pad the report panel uses. */
const padStoreNumber = (n: string | number) => String(n).padStart(3, "0");

const fmtOrderDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${+m}/${+d}/${y}`;
};

/**
 * The left panel while an order is being edited.
 *
 * It replaces the configuration rather than sitting beside it, because the two
 * answer different questions: the configuration narrows every line in the
 * range, and this picks the one order a save is allowed to carry. Six filters
 * reducing a set of lines have nothing to say about which single order you
 * mean.
 *
 * Both of its own filters are read off the orders in the result, and the dates
 * offered are only the dates the chosen store ordered on — so the two can
 * never meet on nothing. Neither of them closes the open order: a left panel
 * control should narrow a list, not throw away the document being worked on.
 */
const OrderPickerPanel = ({
  docs,
  openKey,
  onPick,
  storeNumber,
  orderDate,
  onStore,
  onDate,
  onClear,
  onOpenSearch,
  blocked,
  startDate,
  endDate,
  scopeLabel,
}: Props) => {
  const stores = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of docs) if (!seen.has(d.storenumber)) seen.set(d.storenumber, d.storename);
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [docs]);

  /** Dates for the chosen store, so the pair of filters always has an answer. */
  const dates = useMemo(() => {
    const pool = storeNumber
      ? docs.filter((d) => d.storenumber === storeNumber)
      : docs;
    return [...new Set(pool.map((d) => d.order_date))].sort((a, b) =>
      b.localeCompare(a),
    );
  }, [docs, storeNumber]);

  const shown = useMemo(
    () =>
      docs.filter((d) => {
        if (storeNumber && d.storenumber !== storeNumber) return false;
        if (orderDate && d.order_date !== orderDate) return false;
        return true;
      }),
    [docs, storeNumber, orderDate],
  );

  const open = docs.find((d) => d.key === openKey) ?? null;
  const openIsHidden = open !== null && !shown.some((d) => d.key === open.key);
  const filtered = storeNumber !== "" || orderDate !== "";

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: 300 }}
    >
      <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-custom-white font-medium text-[13px] flex-1 truncate">
            Order to edit
          </span>
          <button
            onClick={onOpenSearch}
            title="New search"
            className="text-custom-white/95 hover:text-custom-white transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-1.5 mt-1 border-t border-custom-white/[0.08] flex items-baseline gap-2">
          <span className="text-custom-white/95 text-[12px] truncate">
            {scopeLabel}
          </span>
          <span className="text-custom-white/95 text-[12px] flex-shrink-0 ml-auto">
            {startDate} – {endDate}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 px-3 pt-3 pb-2 flex flex-col gap-2">
        <Field label="Store">
          <select
            value={storeNumber}
            onChange={(e) => onStore(e.target.value)}
            className={`w-full rounded-md border px-2 py-1 text-[12px] text-content transition-colors ${
              storeNumber
                ? "border-filter_active_border bg-filter_active font-semibold"
                : "border-content/20 bg-custom-white"
            }`}
            style={{ outline: "none" }}
          >
            <option value="">Every store ({stores.length})</option>
            {stores.map(([num, name]) => (
              <option key={num} value={num}>
                {padStoreNumber(num)} — {name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Order date">
          <select
            value={orderDate}
            onChange={(e) => onDate(e.target.value)}
            className={`w-full rounded-md border px-2 py-1 text-[12px] text-content transition-colors ${
              orderDate
                ? "border-filter_active_border bg-filter_active font-semibold"
                : "border-content/20 bg-custom-white"
            }`}
            style={{ outline: "none" }}
          >
            <option value="">Every date ({dates.length})</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {fmtOrderDate(d)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-2 px-3 pb-2 flex-shrink-0">
        <span className="text-[11px] text-content/95 tabular-nums flex-1">
          {shown.length === docs.length
            ? `${docs.length.toLocaleString()} orders in range`
            : `${shown.length.toLocaleString()} of ${docs.length.toLocaleString()} orders`}
        </span>
        {filtered && (
          <button
            onClick={onClear}
            className="text-[11px] font-medium text-content/95 underline hover:text-content"
          >
            Clear both
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-3 pb-3 flex flex-col gap-2">
        {shown.length === 0 ? (
          <span className="text-[12px] text-content/95 px-1 py-2">
            No order in the range matches both filters.
          </span>
        ) : (
          shown.map((d) => {
            const isOpen = d.key === openKey;
            return (
              <button
                key={d.key}
                onClick={() => onPick(d)}
                disabled={blocked && !isOpen}
                title={
                  blocked && !isOpen
                    ? "Submit or undo the changes on this order first"
                    : undefined
                }
                className={`text-left rounded-lg border bg-custom-white px-2.5 py-2 transition-colors disabled:opacity-45 ${
                  isOpen
                    ? "border-brand_navy border-l-[3px] bg-row_selected"
                    : "border-brand_line border-l-[3px] border-l-brand_line_2 hover:border-row_selected_border hover:bg-row_selected"
                }`}
              >
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[12.5px] font-bold text-content tabular-nums truncate">
                    {padStoreNumber(d.storenumber)} — {d.storename}
                  </span>
                  <span className="ml-auto flex-shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-content/95">
                    {d.order_type}
                  </span>
                </span>
                <span className="block text-[11px] text-content/95 tabular-nums">
                  {fmtOrderDate(d.order_date)} · order {d.order_id} ·{" "}
                  {d.lineCount.toLocaleString()} lines
                </span>
              </button>
            );
          })
        )}
      </div>

      {openIsHidden && open && (
        <div className="flex-shrink-0 mx-3 mb-2 rounded-md bg-severity_watch_bg px-2 py-1.5 text-[11px] leading-snug text-severity_watch_text">
          Still editing {padStoreNumber(open.storenumber)} —{" "}
          {fmtOrderDate(open.order_date)}, which this filter does not list.
        </div>
      )}

      <div className="border-t border-gray-100 px-3 py-2 flex-shrink-0">
        <span className="block text-[11px] leading-snug text-content/95">
          One order is one editable document. The save refuses a file that spans
          two stores or two dates, so the list never offers one.
        </span>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="block text-[10px] font-semibold uppercase tracking-wide text-content/95 mb-1">
      {label}
    </span>
    {children}
  </div>
);

export default OrderPickerPanel;
