import { useMemo, useState } from "react";
import MultiSelectFilter from "../../../../../components-dev/filters/MultiSelectFilter";
import RecapItemsTable from "./RecapItemsTable";
import RecapPager from "./RecapPager";
import { dayLabel } from "./recapFormat";
import { TRAY } from "./recapGrid";
import { clampPage } from "./recapItemPaging";
import {
  filterItemRows,
  itemTotals,
  mergeItems,
  subDeptOptions,
  vendorOptions,
} from "./recapItemRows";
import type { PeriodItems } from "./recapItemRows";
import { DEFAULT_ITEM_SORT, nextItemSort, sortItemRows } from "./recapItemSort";
import type { ItemSort, ItemSortCol } from "./recapTypes";

/**
 * Summary's item view (board 18): every item the period sold, a page at a
 * time, opened from View items on the Baskets card. It fills the panel the
 * way Top 200's list does, not a card on a tray.
 *
 * Still the Summary tab, and still filtered by the day cards: All week lists
 * each item once with the week's units, weight and net sales; a picked day
 * lists that day's. Picking another day card here keeps the search and the
 * filters and goes back to page 1; Back to summary shows the cards for
 * whatever day is picked by then.
 *
 * Search by name or UPC, then Sub depts and Vendors (the shared multi-select:
 * empty means all, and an option the other filter leaves empty drops out).
 * Clear all, there only while something is narrowing the list, empties them.
 * With vendors ticked, an item counts only their share of it. Sorted, as Top
 * 200 is, by net sales, biggest first. Sort, filters and search run over the
 * whole list; the totals row is the whole list too.
 *
 * No grades, no last week or last year. The download is the Daily Recap
 * preset in Export CSV.
 */
const RecapItemsView = ({
  items,
  periodKey,
  withPounds,
  narrow,
  onBack,
}: {
  items: PeriodItems;
  /** Changes with the day cards: a new period starts on page 1. */
  periodKey: string;
  withPounds: boolean;
  narrow: boolean;
  onBack: () => void;
}) => {
  const [search, setSearch] = useState("");
  const [subDepts, setSubDepts] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [sort, setSort] = useState<ItemSort>(DEFAULT_ITEM_SORT);
  const [pageSize, setPageSize] = useState(100);
  // The page belongs to one list: any change of period, search, filter, sort
  // or page size is a new list, and page 30 of the old one means nothing.
  const listKey = [
    periodKey,
    search,
    subDepts.join("|"),
    vendors.join("|"),
    sort.column,
    sort.direction,
    pageSize,
  ].join("~");
  const [paged, setPaged] = useState({ key: listKey, page: 0 });

  // Clear all empties the search and both filters; the sort is left as it is.
  const filtering =
    search.trim() !== "" || subDepts.length > 0 || vendors.length > 0;
  const clearFilters = () => {
    setSearch("");
    setSubDepts([]);
    setVendors([]);
  };

  const days = items.status === "ready" ? items.days : null;
  const all = useMemo(() => (days ? mergeItems(days, []) : []), [days]);
  const underVendors = useMemo(
    () => (days && vendors.length ? mergeItems(days, vendors) : all),
    [days, vendors, all],
  );
  const filtered = useMemo(
    () => filterItemRows(underVendors, subDepts, search),
    [underVendors, subDepts, search],
  );
  const sorted = useMemo(() => sortItemRows(filtered, sort), [filtered, sort]);
  const totals = useMemo(() => itemTotals(filtered), [filtered]);
  const deptOptions = useMemo(
    () => subDeptOptions(all, underVendors),
    [all, underVendors],
  );
  const vendorOpts = useMemo(
    () => vendorOptions(all, subDepts),
    [all, subDepts],
  );

  const page = clampPage(
    paged.key === listKey ? paged.page : 0,
    sorted.length,
    pageSize,
  );
  const rows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <section
      aria-label="Items"
      className={`${TRAY} h-full min-h-0 flex flex-col overflow-hidden`}
    >
      <div className="flex-none flex flex-wrap items-center gap-2.5 px-[18px] py-3 border-b border-brand_line">
        <button
          type="button"
          onClick={onBack}
          className="flex-none px-2.5 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-semibold transition-colors"
        >
          Back to summary
        </button>
        <span className="w-px h-[22px] bg-brand_line mx-1" aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item or UPC…"
          aria-label="Search items"
          className={`${narrow ? "w-[180px]" : "w-[260px]"} text-[12.5px] px-2.5 py-1.5 rounded-md border border-gray-200 bg-custom-white text-content`}
        />
        <MultiSelectFilter
          options={deptOptions}
          values={subDepts}
          onChange={setSubDepts}
          placeholder="All sub depts"
          noun="sub depts"
          className={narrow ? "w-[140px]" : "w-[170px]"}
        />
        <MultiSelectFilter
          options={vendorOpts}
          values={vendors}
          onChange={setVendors}
          placeholder="All vendors"
          noun="vendors"
          className={narrow ? "w-[140px]" : "w-[170px]"}
        />
        {filtering && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] font-medium text-content underline hover:text-brand_navy"
          >
            Clear all
          </button>
        )}
      </div>

      {items.status === "ready" ? (
        <>
          <RecapItemsTable
            rows={rows}
            totals={totals}
            sort={sort}
            onSort={(col: ItemSortCol) =>
              setSort((cur) => nextItemSort(cur, col))
            }
            withPounds={withPounds}
            narrow={narrow}
          />
          <RecapPager
            page={page}
            pageSize={pageSize}
            total={sorted.length}
            onPage={(p) => setPaged({ key: listKey, page: p })}
            onPageSize={setPageSize}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6 text-[13px] text-content text-center">
          {items.status === "error"
            ? `The items for ${items.dates.map(dayLabel).join(", ")} could not be read.`
            : "Reading the items…"}
        </div>
      )}
    </section>
  );
};

export default RecapItemsView;
