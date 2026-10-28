import { useMemo, type ReactNode } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { matchesPick, type OrderDoc } from "../orderEdit";

interface Props {
  /** Every order in the range, newest first. */
  docs: OrderDoc[];
  /** The one being edited, if any. */
  openKey: string | null;
  onPick: (doc: OrderDoc) => void;
  /**
   * Orders holding changes not yet submitted. Fix cost stages a cost into
   * every order carrying the item without opening any of them, so this is how
   * you see which orders it touched.
   */
  changedKeys: Set<string>;
  storeNumber: string;
  orderDate: string;
  orderType: string;
  onStore: (value: string) => void;
  onDate: (value: string) => void;
  onType: (value: string) => void;
  onClear: () => void;
  onOpenSearch: () => void;
  /** Held while a new line is half filled in, so a click cannot discard it. */
  blocked: boolean;
  startDate: string;
  endDate: string;
  scopeLabel: string;
  /**
   * Orders, or the Problems tab, at the top of the panel. Store, order date
   * and order type belong to Orders — they narrow the list of orders to open.
   * Problems has its own three flag rows and works across every loaded
   * order; which stores a fix reaches is decided per item, by its ticks.
   */
  tab: "orders" | "problems";
  onTab: (tab: "orders" | "problems") => void;
  /** Flagged items not yet staged or skipped, for the tab's count. */
  problemsToDo: number;
  /** The Problems tab's content, built by the page that owns the drafts. */
  problems: ReactNode;
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
  changedKeys,
  storeNumber,
  orderDate,
  orderType,
  onStore,
  onDate,
  onType,
  onClear,
  onOpenSearch,
  blocked,
  startDate,
  endDate,
  scopeLabel,
  tab,
  onTab,
  problemsToDo,
  problems,
}: Props) => {
  /**
   * What each filter offers, narrowed by the other two.
   *
   * A store that did not order on the chosen date is not offered, and neither
   * is a date that store has nothing on — so no combination of the three can
   * be picked that leaves the list empty.
   */
  const matches = (
    d: OrderDoc,
    skip: "store" | "date" | "type" | null,
  ) => matchesPick(d, { storeNumber, orderDate, orderType }, skip);

  const stores = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of docs) {
      if (matches(d, "store") && !seen.has(d.storenumber)) {
        seen.set(d.storenumber, d.storename);
      }
    }
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [docs, orderDate, orderType]);

  const dates = useMemo(() => {
    const seen = new Set<string>();
    for (const d of docs) if (matches(d, "date")) seen.add(d.order_date);
    return [...seen].sort((a, b) => b.localeCompare(a));
  }, [docs, storeNumber, orderType]);

  const types = useMemo(() => {
    const seen = new Set<string>();
    for (const d of docs) if (matches(d, "type")) seen.add(d.order_type);
    return [...seen].sort();
  }, [docs, storeNumber, orderDate]);

  const shown = useMemo(
    () => docs.filter((d) => matches(d, null)),
    [docs, storeNumber, orderDate, orderType],
  );

  const open = docs.find((d) => d.key === openKey) ?? null;
  const openIsHidden = open !== null && !shown.some((d) => d.key === open.key);
  const filtered = storeNumber !== "" || orderDate !== "" || orderType !== "";

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: 300 }}
    >
      <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-custom-white font-medium text-[13px] flex-1 truncate">
            {tab === "problems" ? "Cost problems" : "Order to edit"}
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

      <div className="flex flex-shrink-0 border-b border-brand_line" role="tablist">
        {(
          [
            ["orders", "Orders", shown.length],
            ["problems", "Problems", problemsToDo],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => onTab(id)}
            className={`flex-1 py-2 text-[12.5px] transition-colors ${
              tab === id
                ? "font-bold text-brand_navy shadow-[inset_0_-2px_0_rgb(var(--color-brand-navy))]"
                : "font-medium text-content/95 hover:text-content"
            }`}
          >
            {label}{" "}
            <span className="tabular-nums">{n.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {tab === "problems" ? (
        problems
      ) : (
      <>
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

        <Field label="Order type">
          <select
            value={orderType}
            onChange={(e) => onType(e.target.value)}
            className={`w-full rounded-md border px-2 py-1 text-[12px] text-content transition-colors ${
              orderType
                ? "border-filter_active_border bg-filter_active font-semibold"
                : "border-content/20 bg-custom-white"
            }`}
            style={{ outline: "none" }}
          >
            <option value="">Every type ({types.length})</option>
            {types.map((v) => (
              <option key={v} value={v}>
                {v}
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
        {changedKeys.size > 0 && (
          <span className="flex-shrink-0 rounded bg-severity_watch_bg px-1.5 py-0.5 text-[10.5px] font-semibold text-severity_watch_text">
            {changedKeys.size} changed
          </span>
        )}
        {filtered && (
          <button
            onClick={onClear}
            className="text-[11px] font-medium text-content/95 underline hover:text-content"
          >
            Clear all
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
                    ? "Add or discard the line you are filling in first"
                    : undefined
                }
                className={`text-left rounded-lg border bg-custom-white px-2.5 py-2 transition-colors disabled:opacity-45 ${
                  isOpen
                    ? "border-brand_navy border-l-[3px] bg-row_selected"
                    : "border-brand_line border-l-[3px] border-l-brand_line_2 hover:border-row_selected_border hover:bg-row_selected"
                }`}
              >
                {/* The order number leads, because a store that ordered three
                    times in a day gives three cards that are otherwise the
                    same line of text. */}
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[12.5px] font-bold text-content tabular-nums truncate">
                    Order {d.order_id}
                  </span>
                  {changedKeys.has(d.key) && (
                    <span
                      title="Changes not yet submitted"
                      className="h-[7px] w-[7px] flex-shrink-0 self-center rounded-full bg-severity_watch_text"
                    />
                  )}
                  <span className="ml-auto flex-shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-content/95">
                    {d.order_type}
                  </span>
                </span>
                <span className="block text-[11px] text-content/95 tabular-nums truncate">
                  {padStoreNumber(d.storenumber)} — {d.storename} ·{" "}
                  {fmtOrderDate(d.order_date)} · {d.lineCount.toLocaleString()}{" "}
                  lines
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
          One order is one editable document. Orders marked with a dot have
          changes waiting, and Submit sends every one of them.
        </span>
      </div>
      </>
      )}
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
