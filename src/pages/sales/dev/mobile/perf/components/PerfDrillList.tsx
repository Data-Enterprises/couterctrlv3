// Utils
import {
  fmtChange,
  gradedChangePct,
  type PerfPair,
  type PairSort,
} from "../utils/perfData";
import { hourSorts, itemSorts, scaleOf, subSorts } from "../utils";
import { DEPT_RING_KEY } from "../../../utils/ledgerUtils";

// Interfaces
import type { PerfDrill } from "../../../../../../features/dev/devSalesPerfSlice";
import type { ItemProps } from "../interfaces";

// Components
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import MobileSortChips from "../../../../../../components-dev/mobile/MobileSortChips";
import PerfChange from "../../../../../../components-dev/mobile/perf/PerfChange";
import { TY_COLOR } from "../../../../../../components-dev/mobile/perf/perfColors";
import Bars from "./Bars";

interface PerfDrillListProps {
  drill: Exclude<PerfDrill, null>;
  pairs: PerfPair[];
  sort: PairSort | null;
  sortDir: "asc" | "desc" | null;
  onSort: (s: PairSort) => void;
  listPartial: boolean;
  listNote: string;
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
  /** How figures read, and what the size sort is called: "Sales" or
   *  "Units", per the switch at the top of the screen. */
  fmt: (n: number) => string;
  sizeLabel: string;
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
  shownDay,
  loading,
  storeName,
  allowItems,
  openSubDept,
  onOpenSubDept,
  items,
  fmt,
  sizeLabel,
}: PerfDrillListProps) => {
  // A department opens its items; an hour has nothing below it. The group
  // card can't open either — `subs/subs` answers for a store id.
  const opensItems = drill === "subs" && allowItems;
  const showingItems = opensItems && openSubDept !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/95">
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line_field"
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
              <span className="flex-none text-[12px] text-content/95">
                {items.query.trim()
                  ? `${items.pairs.length} of ${items.total}`
                  : `${items.total} ${items.total === 1 ? "item" : "items"}`}
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-brand_line px-3.5 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
            <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/95" />
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
                className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/95 active:bg-custom-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <MobileSortChips
          options={itemSorts(sizeLabel)}
          value={items.sort}
          dir={items.sortDir}
          onChange={items.onSort}
        />

        {!shownDay && items.noTy && (
          <p className="border-b border-brand_line bg-fill_muted px-3.5 py-2 text-[11.5px] font-semibold text-content">
            Nothing sold this week. Showing last year's items.
          </p>
        )}

        {!shownDay && items.partial && (
          <p className="border-b border-brand_line bg-fill_muted px-3.5 py-2 text-[11.5px] font-semibold text-content">
            Last year: {items.note}
          </p>
        )}

        {items.loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/95">
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line_field"
              style={{ borderTopColor: TY_COLOR }}
            />
            Loading items...
          </div>
        ) : items.pairs.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
            {items.query.trim()
              ? `Nothing matches "${items.query.trim()}".`
              : `No items sold ${shownDay ? "on this day" : "this week or last year"}.`}
          </div>
        ) : (
          // One scale for the whole item list, computed once rather than per
          // row — see `scaleOf`.
          ((itemMax) =>
          items.pairs.map((p) => {
            // The department's own sales, folded into one row
            // (`foldDepartmentRings`). It has no UPC, so the line where one
            // would sit says what it is instead.
            const deptRing = p.key === DEPT_RING_KEY;
            return (
              <div
                key={p.key}
                className="border-t border-brand_line px-3.5 py-3 first:border-t-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                    {p.label}
                  </span>
                  <span className="flex-none text-[12px] font-semibold text-content/95">
                    <PerfChange pct={gradedChangePct(p)} format={fmtChange} />
                  </span>
                </div>
                <div className="font-mono text-[10px] tracking-wider text-content/95">
                  {deptRing ? "No item scanned: rung on the department key" : p.key}
                </div>
                <Bars p={p} max={itemMax} fmt={fmt} />
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
        options={opensItems ? subSorts(sizeLabel) : hourSorts(sizeLabel)}
        value={sort}
        dir={sortDir}
        onChange={onSort}
      />

      {/* The chevrons say the rows go somewhere; this says where. Without it
          the only way to discover items is to tap a department and find out —
          and on the group card, where rows lead nowhere, its absence is the
          honest signal. */}
      {opensItems && (
        <p className="border-b border-brand_line px-3.5 py-2.5 text-[12px] text-content/95">
          Open a sub department to see its items.
        </p>
      )}

      {listPartial && (
        <p className="border-b border-brand_line bg-fill_muted px-3.5 py-2 text-[11.5px] font-semibold text-content">
          Last year: {listNote}
        </p>
      )}

      {pairs.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
          Nothing recorded for this selection.
        </div>
      ) : (
        ((listMax) =>
        pairs.map((p) => {
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
                <span className="flex-none text-[12px] font-semibold text-content/95">
                  <PerfChange pct={gradedChangePct(p)} format={fmtChange} />
                </span>
                {opensItems && (
                  <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/95" />
                )}
              </div>
              <Bars p={p} max={listMax} fmt={fmt} />
            </Row>
          );
        }))(scaleOf(pairs))
      )}
    </div>
  );
};

export default PerfDrillList;
