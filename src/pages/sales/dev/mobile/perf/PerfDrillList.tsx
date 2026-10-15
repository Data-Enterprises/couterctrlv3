import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import MobileSortChips, {
  type SortOption,
} from "../../../../../components-dev/mobile/MobileSortChips";
import PairedBars from "../../../../../components-dev/mobile/perf/PairedBars";
import { TY_COLOR } from "../../../../../components-dev/mobile/perf/perfColors";
import {
  cmpLabels,
  cmpShort,
  cmpWord,
  fmtChange,
  pairChangePct,
  type CmpBasis,
  type PerfPair,
  type PairSort,
} from "./perfData";
import type { PerfDrill } from "../../../../../features/dev/devSalesPerfSlice";

/** What each drill can sort by. Hours adds the time of day, which is also its
 *  default — a day reads as a timeline first.
 *
 *  No sort by name. These lists are read for where the money went, and
 *  alphabetical order answers a question nobody brought to a Performance
 *  page; `PairSort` keeps the "name" case because the store list still sorts
 *  by store number, which is an identifier rather than a name. */
const subSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];

const hourSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "time", label: "Time" },
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];

const itemSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];


/**
 * This year against last year, under the row's name.
 *
 * Was two lines of mono figures, on the reasoning that these lists are read by
 * scanning names and twenty sub departments of bars turn a list into a scroll.
 * The scroll is real and the rows are taller for it, but figures alone made
 * every row its own puzzle: $32,676.83 against $34,115.27 is a subtraction the
 * reader has to perform, and a list of twenty is twenty subtractions. Bars are
 * the comparison, pre-done, and the figures ride along in their value column —
 * so this costs a line per row and gives back the reason the list exists.
 * Asked for by a client, on all three drills.
 *
 * `max` is the list's own largest figure, never the row's, so a $200
 * department and a $20,000 one are not drawn the same width.
 */
const Bars = ({
  ty,
  ly,
  noLy,
  max,
  basis,
}: {
  ty: number;
  ly: number;
  noLy?: boolean;
  max: number;
  basis: CmpBasis;
}) => (
  <div className="mt-1.5">
    <PairedBars
      ty={ty}
      ly={ly}
      max={max}
      labels={cmpLabels(basis)}
      lyUnavailable={noLy}
      compact
    />
  </div>
);

/** The scale every row in one drill shares. 1 floors it so an all-zero list
 *  divides by something. */
const scaleOf = (pairs: PerfPair[]) =>
  Math.max(...pairs.map((p) => Math.max(p.ty, p.noLy ? 0 : p.ly)), 1);

interface ItemProps {
  pairs: PerfPair[];
  total: number;
  loading: boolean;
  sort: PairSort | null;
  sortDir: "asc" | "desc" | null;
  onSort: (s: PairSort) => void;
  query: string;
  onQuery: (q: string) => void;
  partial: boolean;
  note: string;
  /** Which period these items are drawn against. */
  basis: CmpBasis;
  /** Nothing sold this week — the rows on screen are last year's, at $0.00. */
  noTy: boolean;
}

interface Props {
  drill: Exclude<PerfDrill, null>;
  pairs: PerfPair[];
  sort: PairSort | null;
  sortDir: "asc" | "desc" | null;
  onSort: (s: PairSort) => void;
  listPartial: boolean;
  listNote: string;
  /** Which period the sub-department and hour rows are drawn against. */
  basis: CmpBasis;
  shownDay: string | null;
  /** The store's bundle is still in flight. */
  loading: boolean;
  storeName: string;
  /** False for the group, whose rows lead nowhere — items are fetched per
   *  store. The rows render the same, they just don't invite a tap. */
  allowItems: boolean;
  openSubDept: { id: number; label: string } | null;
  onOpenSubDept: (v: { id: number; label: string } | null) => void;
  items: ItemProps;
}

/**
 * The list under an expanded store card: sub departments, one department's
 * items, or hours.
 *
 * Items are a level inside Subs rather than a sibling of it, so opening one
 * replaces the sub department list and leaves a breadcrumb rather than a bare
 * back arrow. The crumb names the department because the card header above it
 * already names the store — between them, a row is never orphaned from what it
 * describes, which is the thing a drill inside a list can otherwise lose.
 *
 * Hours are read-only. There is nothing below an hour.
 */
const PerfDrillList = ({
  drill,
  pairs,
  sort,
  sortDir,
  onSort,
  listPartial,
  listNote,
  basis,
  shownDay,
  loading,
  storeName,
  allowItems,
  openSubDept,
  onOpenSubDept,
  items,
}: Props) => {
  // A department opens its items; an hour has nothing below it. The group
  // card can't open either — `subs/subs` answers for a store id.
  const opensItems = drill === "subs" && allowItems;
  const showingItems = opensItems && openSubDept !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85">
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
          style={{ borderTopColor: TY_COLOR }}
        />
        Loading {storeName}...
      </div>
    );
  }

  if (showingItems && openSubDept) {
    return (
      <div>
        <div className="border-b border-brand_line px-3.5 pb-2.5 pt-2">
          <button
            type="button"
            onClick={() => onOpenSubDept(null)}
            className="-ml-1 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold active:bg-bkg"
            style={{ color: TY_COLOR }}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Sub Depts
          </button>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold text-content">
              {openSubDept.label}
            </span>
            {!items.loading && (
              <span className="flex-none text-[12px] text-content/85">
                {items.query.trim()
                  ? `${items.pairs.length} of ${items.total}`
                  : `${items.total} ${items.total === 1 ? "item" : "items"}`}
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-brand_line px-3.5 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
            <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/85" />
            <input
              id={`perf-item-search-${openSubDept.id}`}
              value={items.query}
              onChange={(e) => items.onQuery(e.target.value)}
              placeholder="Description or UPC"
              inputMode="search"
              enterKeyHint="search"
              aria-label="Search items"
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
              style={{
                outline: "none",
                WebkitAppearance: "none",
                boxShadow: "none",
              }}
            />
            {items.query && (
              <button
                type="button"
                onClick={() => items.onQuery("")}
                aria-label="Clear search"
                className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-custom-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <MobileSortChips
          options={itemSorts(items.basis)}
          value={items.sort}
          dir={items.sortDir}
          onChange={items.onSort}
        />

        {!shownDay && items.noTy && (
          <p className="border-b border-brand_line bg-gray-100 px-3.5 py-2 text-[11.5px] font-semibold text-content">
            Nothing sold this week. Showing last year's items.
          </p>
        )}

        {!shownDay && items.partial && (
          <p className="border-b border-brand_line bg-gray-100 px-3.5 py-2 text-[11.5px] font-semibold text-content">
            {cmpWord(items.basis)}: {items.note}
          </p>
        )}

        {items.loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85">
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
              style={{ borderTopColor: TY_COLOR }}
            />
            Loading items...
          </div>
        ) : items.pairs.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
            {items.query.trim()
              ? `Nothing matches "${items.query.trim()}".`
              : `No items sold ${shownDay ? "on this day" : "this week or last year"}.`}
          </div>
        ) : (
          // One scale for the whole item list, computed once rather than per
          // row — see `scaleOf`.
          ((itemMax) =>
          items.pairs.map((p) => {
            const change = pairChangePct(p);
            return (
              <div
                key={p.key}
                className="border-t border-brand_line px-3.5 py-3 first:border-t-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                    {p.label}
                  </span>
                  <span className="flex-none text-[12px] font-semibold text-content/85">
                    {change === null ? "—" : fmtChange(change)}
                  </span>
                </div>
                <div className="font-mono text-[10px] tracking-wider text-content/85">
                  {p.key}
                </div>
                <Bars ty={p.ty} ly={p.ly} noLy={p.noLy} max={itemMax} basis={items.basis} />
              </div>
            );
          }))(scaleOf(items.pairs))
        )}
      </div>
    );
  }

  return (
    <div>
      <MobileSortChips
        options={opensItems ? subSorts(basis) : hourSorts(basis)}
        value={sort}
        dir={sortDir}
        onChange={onSort}
      />

      {/* The chevrons say the rows go somewhere; this says where. Without it
          the only way to discover items is to tap a department and find out —
          and on the group card, where rows lead nowhere, its absence is the
          honest signal. */}
      {opensItems && (
        <p className="border-b border-brand_line px-3.5 py-2.5 text-[12px] text-content/85">
          Open a sub department to see its items.
        </p>
      )}

      {listPartial && (
        <p className="border-b border-brand_line bg-gray-100 px-3.5 py-2 text-[11.5px] font-semibold text-content">
          {cmpWord(basis)}: {listNote}
        </p>
      )}

      {pairs.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
          Nothing recorded for this selection.
        </div>
      ) : (
        ((listMax) =>
        pairs.map((p) => {
          const change = pairChangePct(p);
          const Row = opensItems ? "button" : "div";
          return (
            <Row
              key={p.key}
              {...(opensItems
                ? {
                    type: "button" as const,
                    onClick: () =>
                      onOpenSubDept({ id: Number(p.key), label: p.label }),
                  }
                : {})}
              className={`block w-full border-t border-brand_line px-3.5 py-3 text-left first:border-t-0 ${
                opensItems ? "active:bg-bkg" : ""
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                  {p.label}
                </span>
                {/* The figure the Change sort orders on, so that order can be
                    read off the rows. Neutral: no grading on mobile. A dash
                    when last year sold nothing. */}
                <span className="flex-none text-[12px] font-semibold text-content/85">
                  {change === null ? "—" : fmtChange(change)}
                </span>
                {opensItems && (
                  <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/85" />
                )}
              </div>
              <Bars ty={p.ty} ly={p.ly} noLy={p.noLy} max={listMax} basis={basis} />
            </Row>
          );
        }))(scaleOf(pairs))
      )}
    </div>
  );
};

export default PerfDrillList;
