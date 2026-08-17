import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setInvoiceFailedOnly,
  setInvoiceSelected,
  setInvoiceTextFilter,
} from "../../features/invoicesSlice";
import TextFilter from "../../components/filters/TextFilter";
import SortHeader, { PERF_SORT_HEADER } from "../../components/SortHeader";
import { useTriStateSort } from "../../utils/useTriStateSort";
import InfoButton from "../../components/InfoButton";
import InfoPopover from "../../components/InfoPopover";
import HeaderIconButton from "../../components/HeaderIconButton";
import { INVOICES_INFO } from "./invoicesInfo";
import type { InvoiceRow } from "./present";

/**
 * The invoice list — the same two-row navy header and single-column list the
 * Performance pages use, so a page about a different kind of data still reads
 * as part of the same app.
 *
 * Defaults to the order the file arrived in rather than to a size or a date. An
 * invoice file is a document, and someone checking one against the paper copy
 * wants it in the order it was written — the sorts are there to leave from and
 * come back to.
 */
const COLS = "1fr 74px 64px 96px";

/** The three numeric columns. The invoice column isn't sortable: the list is in
 *  file order, which is the order someone checking against a paper copy wants,
 *  and alphabetising invoice numbers would only scatter that. */
type SortCol = "lines" | "cases" | "cost";

/**
 * Who the file is from and who it's for — the header's first fact, in place of
 * the file name.
 *
 * AWG is the **vendor** who sent the file; `store_nbr` is the store's account
 * number *with* AWG, so the two are named separately rather than run together.
 * That number is not a CounterCtrl `storeid` or `store_number` — the sample's
 * 5401 matches nothing in assignedStores — so it deliberately isn't put through
 * `getStoreName`, and the header shows the number rather than guessing at a
 * name. Once a member → store mapping exists this is the one place that changes.
 *
 * A file can carry several stores, so the label collapses: named while there
 * are few enough to read, counted after that.
 */
const storeLabel = (rows: InvoiceRow[]): string => {
  const stores = [...new Set(rows.map((row) => row.storeNbr))].sort();
  if (stores.length === 0) return "AWG";
  if (stores.length === 1) return `AWG · Store ${stores[0]}`;
  if (stores.length <= 3) return `AWG · Stores ${stores.join(", ")}`;
  return `AWG · ${stores.length} stores`;
};

interface Props {
  onSearchOpen: () => void;
}

const InvoiceListPanel = ({ onSearchOpen }: Props) => {
  const dispatch = useAppDispatch();
  const { rows, fileName, selectedId, failedOnly, textFilter, allReconciled } =
    useAppSelector((s) => s.invoices);
  const [infoOpen, setInfoOpen] = useState(false);
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();

  const failedCount = rows.filter((row) => !row.reconciled).length;
  const stores = useMemo(() => storeLabel(rows), [rows]);

  const term = textFilter.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (failedOnly && row.reconciled) return false;
        if (!term) return true;
        return (
          row.invoiceNbr.toLowerCase().includes(term) ||
          row.storeNbr.toLowerCase().includes(term) ||
          row.retailDept.toLowerCase().includes(term)
        );
      }),
    [rows, failedOnly, term],
  );

  // `Number` on a Decimal string, and only ever to order rows — the figures
  // themselves are never re-derived from it, so nothing displayed passes
  // through a float.
  const visible = applySort(filtered, (row, col) =>
    col === "lines"
      ? row.lineCount
      : col === "cases"
        ? Number(row.totalCases)
        : Number(row.totalCost),
  );

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <div className="flex-shrink-0 bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
          <div className="flex items-center gap-2 min-h-[26px]">
            {/* The file name lives on the hover instead: it's how you'd tell
                two downloads apart, but it isn't what the panel is about. */}
            <span
              title={fileName}
              className="min-w-0 flex-1 text-custom-white font-semibold text-[13px] truncate"
            >
              {stores}
            </span>
            <span className="flex-shrink-0 text-[14px] font-semibold text-custom-white tabular-nums">
              {rows.length} invoices
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
            <HeaderIconButton onClick={onSearchOpen} title="Read another file">
              <MagnifyingGlassIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
            <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
            {/* The headline fact about the file, stated where it can't be
                missed: whether every invoice in it adds up. */}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                allReconciled
                  ? "bg-severity_healthy_bg text-severity_healthy_text"
                  : "bg-severity_critical_bg text-severity_critical_text"
              }`}
            >
              {allReconciled
                ? "All invoices reconciled"
                : `${failedCount} did not reconcile`}
            </span>
            <div className="flex-1" />
            <div className="relative flex-shrink-0">
              <InfoButton onClick={() => setInfoOpen((prev) => !prev)} />
              {infoOpen && (
                <InfoPopover
                  title={INVOICES_INFO.title}
                  purpose={INVOICES_INFO.purpose}
                  glossary={INVOICES_INFO.glossary}
                  onClose={() => setInfoOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          <button
            onClick={() => dispatch(setInvoiceFailedOnly(!failedOnly))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow bg-severity_critical_bg text-severity_critical_text ${
              failedOnly
                ? "ring-2 shadow-sm ring-severity_critical_text/40"
                : ""
            }`}
          >
            Did not reconcile{" "}
            <span className="tabular-nums">{failedCount}</span>
          </button>
          <div className="flex-1 min-w-[140px]">
            <TextFilter
              value={textFilter}
              onChange={(v) => dispatch(setInvoiceTextFilter(v))}
              placeholder="Filter invoices…"
            />
          </div>
        </div>

        <div
          className="flex-shrink-0 grid gap-3 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>Invoice</span>
          <SortHeader
            col="lines"
            label="Lines"
            sort={sort}
            onSort={handleSort}
            className={`${PERF_SORT_HEADER} justify-end`}
          />
          <SortHeader
            col="cases"
            label="Cases"
            sort={sort}
            onSort={handleSort}
            className={`${PERF_SORT_HEADER} justify-end`}
          />
          <SortHeader
            col="cost"
            label="Cost"
            sort={sort}
            onSort={handleSort}
            className={`${PERF_SORT_HEADER} justify-end`}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {visible.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              No invoices matched
            </div>
          )}

          {visible.map((row) => (
            <button
              key={row.id}
              onClick={() => dispatch(setInvoiceSelected(row.id))}
              className={`w-full text-left grid gap-3 px-3 py-2.5 items-center border-b border-gray-100 transition-colors ${
                row.id === selectedId ? "bg-row_selected" : "hover:bg-gray-50"
              }`}
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  {/* Red only where it means something: an invoice whose own
                      totals don't agree with its lines. */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      row.reconciled
                        ? "bg-severity_healthy_text"
                        : "bg-severity_critical_text"
                    }`}
                  />
                  <span className="block text-[13px] font-medium text-content truncate">
                    {row.invoiceNbr}
                  </span>
                </span>
                <span className="block text-[12px] text-content/85 truncate">
                  Store {row.storeNbr} · Dept {row.retailDept}
                  {row.deliveryDate ? ` · ${row.deliveryDate}` : ""}
                </span>
              </span>
              <span className="text-[13px] text-right tabular-nums text-content">
                {row.lineCount}
              </span>
              <span className="text-[13px] text-right tabular-nums text-content">
                {row.totalCases}
              </span>
              <span className="text-[13px] text-right tabular-nums font-medium text-content">
                ${row.totalCost}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceListPanel;
