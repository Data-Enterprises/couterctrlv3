import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import MobileSortChips, {
  type SortOption,
} from "../../../components/mobile/MobileSortChips";
import PairedBars from "../../sales/mobile/perf/PairedBars";
import { TY_COLOR } from "../../sales/mobile/perf/perfColors";
import { formatCurrency2, formatDateSimple } from "../../../utils";
import type { EventSort } from "../../../features/eventPerfSlice";
import {
  receiptLabel,
  type EventGroupRow,
  type EventReceipt,
} from "./eventPerfData";

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

interface Props {
  view: "cashiers" | "receipts";
  /** Rebuilding after a scope change — the lists here are the page's heaviest
   *  work, so the spinner is honest rather than a flash of an empty list. */
  building: boolean;
  measure: "transactions" | "amount";

  /** Cashiers. */
  rows: EventGroupRow[];
  sortOptions: SortOption<EventSort>[];
  sort: EventSort | null;
  onSort: (s: EventSort) => void;
  onSelectCashier: (row: { key: string; label: string }) => void;

  /** Receipts, either the whole store's or one person's. */
  receipts: EventReceipt[];
  query: string;
  onQuery: (q: string) => void;
  onOpenReceipt: (saleId: string) => void;

  /** The person whose receipts are showing, if the list was reached that way. */
  cashierLabel: string | null;
  onClearCashier: () => void;

  /** More rows exist than are drawn. */
  remaining: number;
  onShowMore: () => void;
}

const Empty = ({ query }: { query: string }) => (
  <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
    {query
      ? `Nothing matches "${query}".`
      : "Nothing recorded for this selection."}
  </div>
);

/**
 * The list under an expanded store card: the people in it, or the receipts.
 *
 * A person's receipts are a level inside Cashiers rather than a sibling of it,
 * so opening one replaces the list and leaves a breadcrumb. The crumb names the
 * person because the header above already names the store — between them a row
 * is never orphaned from what it describes.
 *
 * Receipts keep their newest-first order and never sort: a run of voids in one
 * evening is the pattern being looked for, and ordering by size destroys it.
 */
const EventDrillList = ({
  view,
  building,
  measure,
  rows,
  sortOptions,
  sort,
  onSort,
  onSelectCashier,
  receipts,
  query,
  onQuery,
  onOpenReceipt,
  cashierLabel,
  onClearCashier,
  remaining,
  onShowMore,
}: Props) => {
  const fmt = measure === "amount" ? formatCurrency2 : fmtInt;
  const listMax = Math.max(
    ...rows.map((r) =>
      Math.max(measure === "amount" ? r.amount : r.transactions, r.baseline ?? 0),
    ),
    1,
  );

  const spinner = (
    <div
      className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85"
      style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
    >
      <span
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
        style={{ borderTopColor: TY_COLOR }}
      />
      Building the list...
    </div>
  );

  const more = remaining > 0 && (
    <button
      type="button"
      onClick={onShowMore}
      className="block w-full border-t border-gray-100 py-3 text-center text-[12px] font-semibold active:bg-bkg"
      style={{ color: TY_COLOR }}
    >
      Show more
      <span className="text-content/85"> · {fmtInt(remaining)} left</span>
    </button>
  );

  if (view === "receipts") {
    return (
      <div>
        {/* The crumb only appears when a person was opened. Reaching receipts
            by tab means the whole store's, which has nothing to back out to. */}
        {cashierLabel && (
          <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-2">
            <button
              type="button"
              onClick={onClearCashier}
              className="-ml-1 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold active:bg-bkg"
              style={{ color: TY_COLOR }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Cashiers
            </button>
            <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-bold text-content">
              {cashierLabel}
            </span>
          </div>
        )}

        <div className="border-b border-gray-100 px-3.5 py-2">
          <input
            id="event-receipt-search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Sale ID, cashier or lane"
            inputMode="search"
            aria-label="Find a receipt"
            className="w-full rounded-lg border-0 bg-bkg px-3 py-2.5 text-[14px] text-content placeholder:text-content/85"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              boxShadow: "none",
            }}
          />
        </div>

        {building ? (
          spinner
        ) : receipts.length === 0 ? (
          <Empty query={query.trim()} />
        ) : (
          <>
            {receipts.map((t) => (
              <button
                key={t.saleId}
                type="button"
                onClick={() => onOpenReceipt(t.saleId)}
                className="block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
              >
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                    #{receiptLabel(t.saleId)}
                  </span>
                  <span className="flex-none font-display text-[13px] font-bold text-content">
                    {formatCurrency2(t.amount)}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
                </div>
                {/* Who, then when, then where. The person is what someone is
                    following; the lane matters once they have one. */}
                <div className="mt-0.5 truncate text-[11px] text-content/85">
                  {[
                    t.cashierName,
                    t.day ? formatDateSimple(t.day) : "",
                    t.terminal ? `lane ${t.terminal}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </button>
            ))}
            {more}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <MobileSortChips options={sortOptions} value={sort} onChange={onSort} />
      {building ? (
        spinner
      ) : rows.length === 0 ? (
        <Empty query="" />
      ) : (
        <>
          {rows.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onSelectCashier({ key: r.key, label: r.label })}
              className="block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                  {r.label}
                </span>
                <span className="flex-none font-display text-[13px] font-bold text-content">
                  {measure === "amount"
                    ? formatCurrency2(r.amount)
                    : fmtInt(r.transactions)}
                </span>
                <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
              </div>
              <div className="mt-0.5 truncate text-[11px] text-content/85">
                {[
                  measure === "amount"
                    ? `${fmtInt(r.transactions)} transactions`
                    : formatCurrency2(r.amount),
                  r.sub,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <div className="mt-2">
                <PairedBars
                  ty={measure === "amount" ? r.amount : r.transactions}
                  ly={r.baseline ?? 0}
                  max={listMax}
                  labels={["WK", "AVG"]}
                  format={fmt}
                  compact
                />
              </div>
            </button>
          ))}
          {more}
        </>
      )}
    </div>
  );
};

export default EventDrillList;
