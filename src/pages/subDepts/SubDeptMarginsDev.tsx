import { useEffect, useRef, useState } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useSubMarginActions } from "./hooks/useSubMarginActions";
import { useSubMarginState } from "./hooks/useSubMarginState";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSubMargins } from "../../api/subMargins";
import { useParams } from "./hooks";
import {
  setDates,
  hasNoUsableCost,
  getLYDate,
  computeMarginDayMatched,
  computeStoreDayMatched,
  aggSubDeptSales,
  type SubDeptSalesTotals,
} from ".";
import type {
  JsonError,
  SubDept,
  SubMarginsJsonResp,
  SubDeptMargin,
} from "../../interfaces";
import { scopeToStoreNumber, storeNumbersIn } from "../../utils/storeIdentity";
import {
  setSubDeptGrade,
  setLoadingGrades,
  setStoreSalesTotals,
  setWeekTrendMargins,
  setWeekTrendMarginsLY,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  resetSubDeptGrades,
  type SubDeptGrade,
} from "../../features/subMarginSlice";

import MarginPerfLeftPanel from "./display/dev/MarginPerfLeftPanel";
import MarginPerfRightPanel from "./display/dev/MarginPerfRightPanel";
import SmDevSearchOverlay from "./display/dev/SmDevSearchOverlay";
import SubDeptMarginsMobile from "./mobile/devMobile";
import SmDevEntryCard from "./display/dev/SmDevEntryCard";
import ItemFilterModal from "./display/modals/ItemFilterModal";
import ExportModal from "../../components/modals/ExportModal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { costCols, itemCols } from "./display/widgets";

const fetchSafe = (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> =>
  fetchAllPages(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
  ).catch(() => []);

const fetchAllPages = async (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> => {
  const resp = await getSubMargins(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
  );
  const j: SubMarginsJsonResp = resp.data;
  if (j.error !== 0) throw new Error(j.msg ?? "Failed to load margins");

  // Pages 2..N go out together. Sequential paging was tried and measured
  // slower in practice, so the parallel form stands regardless of how many
  // workers the API runs.
  let data: SubDeptMargin[] = j.subs;
  if (j.total_pages > 1) {
    const extras = await Promise.all(
      Array.from({ length: j.total_pages - 1 }, (_, i) =>
        getSubMargins(
          url,
          token,
          subDeptId,
          start,
          end,
          useGroups,
          searchValue,
          singleStore,
          i + 2,
        ),
      ),
    );
    for (const r of extras) {
      const pj: SubMarginsJsonResp = r.data;
      if (pj.error === 0) data = [...data, ...pj.subs];
    }
  }
  return data;
};

/**
 * The `subDeptId` value that asks `subs/subs` for every department at once.
 *
 * Named rather than a bare 0 at the call site, because 0 is also a real
 * department number in the response — `deriveSubDepts` deliberately keeps rows
 * whose `sub_department` is 0. As a *request* argument it means "all"; as a
 * *row value* it means that department. Conflating the two is easy and this
 * name is here to stop it.
 *
 * It also removes a fault in the shape this replaced: that version asked for
 * each department in turn, so on a store that has a department 0 the request
 * for it came back with every item in the store, and department 0 was then
 * graded against all of them.
 */
const ALL_SUB_DEPTS = 0;

/**
 * Rows falling inside a date window, bounds inclusive.
 *
 * Dates are `yyyy-mm-dd`, so a string compare is a date compare — no parsing,
 * and no timezone to get wrong.
 */
const inRange = (rows: SubDeptMargin[], start: string, end: string) =>
  rows.filter((r) => {
    const d = r.sale_date.split("T")[0];
    return d >= start && d <= end;
  });

/** Item rows keyed by the department each row says it belongs to. */
const groupBySubDept = (rows: SubDeptMargin[]) => {
  const by = new Map<number, SubDeptMargin[]>();
  for (const row of rows) {
    const found = by.get(row.sub_department);
    if (found) found.push(row);
    else by.set(row.sub_department, [row]);
  }
  return by;
};

const EMPTY_SALES: SubDeptSalesTotals = { net: 0, qty: 0 };

/**
 * The three item reads for one search, unscoped.
 *
 * One source for the whole page now. `subs/subs` carries store number, sale
 * date, department, sales, tax, quantity and cost on every row, which is
 * everything the store header, the department list, the Sales-metric totals
 * and the margin grades were previously taking from three endpoints between
 * them.
 *
 * Held unscoped so switching between co-located locations re-derives without
 * touching the network.
 */
type RawSearch = {
  items: { ty: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
};

const emptyRaw = (): RawSearch => ({
  items: { ty: [], lw: [], ly: [] },
});

// No sub_department !== 0 filter — Sales doesn't exclude it (aggSubDepts takes
// every row), so dropping it here made this page show one fewer sub department
// and a lower total than Sales.
const deriveSubDepts = (
  rows: { sub_department: number; sub_department_description: string }[],
): SubDept[] =>
  rows
    .reduce((acc: SubDept[], curr) => {
      if (!acc.some((s) => s.id === curr.sub_department)) {
        acc.push({
          id: curr.sub_department,
          desc: curr.sub_department_description,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.id - b.id);

const pctChange = (ty: number, ref: number) =>
  ref > 0 ? ((ty - ref) / ref) * 100 : 0;

const computeSubDeptGrade = (
  tyMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
  sales: {
    ty: SubDeptSalesTotals;
    lw: SubDeptSalesTotals;
    ly: SubDeptSalesTotals;
  },
): SubDeptGrade => {
  // Each metric reads the endpoint that's authoritative for it — getTier and
  // the panels already branch on gradingMetric, so this lands in the right
  // place without any UI change:
  //
  //  Sales metric  -> sub_sales. It has the correct item_ring_type filter
  //                   ('ITEM','SUBD'); subs/subs only matches 'ITEM' and so
  //                   runs short. Same endpoint and formula as the Sales page,
  //                   including its whole-range comparison, so the two agree
  //                   exactly.
  //  Margin metric -> subs/subs, the only source carrying cost. Stays
  //                   day-matched (computeMarginDayMatched) since there's no
  //                   Sales figure it has to line up with.
  const m = computeMarginDayMatched(tyMargins, lwMargins, lyMargins);

  const seen = new Set<string>();
  let noCostCount = 0;
  for (const row of tyMargins) {
    if (!seen.has(row.product_code)) {
      seen.add(row.product_code);
      if (hasNoUsableCost(row)) noCostCount++;
    }
  }

  return {
    tyMarginPct: m.tyMarginPct,
    lyMarginPct: m.lyMarginPct,
    ptsDelta: m.ptsDelta,
    lwMarginPct: m.lwMarginPct,
    lwPtsDelta: m.lwPtsDelta,
    noCostCount,
    tySales: sales.ty.net,
    lySales: sales.ly.net,
    lwSales: sales.lw.net,
    vsLYSalesPct: pctChange(sales.ty.net, sales.ly.net),
    vsLWSalesPct: pctChange(sales.ty.net, sales.lw.net),
    tyWeekOneMargins: tyMargins,
    lyWeekOneMargins: lyMargins,
    lwWeekOneMargins: lwMargins,
  };
};

const SubDeptMarginsDev = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useSubMarginState();
  const toast = useToast();
  const params = useParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  // Raw responses for the current search, plus the location they're being
  // presented as. Refs, not state: the async fetch callbacks below need the
  // live values, and nothing renders off them directly.
  const rawRef = useRef<RawSearch>(emptyRaw());
  const selectedStoreNumber = useAppSelector(
    (s) => s.subMargin.selectedStoreNumber,
  );
  const scopeRef = useRef<string | null>(selectedStoreNumber);
  scopeRef.current = selectedStoreNumber;

  // null = show every location combined ("Both").
  const scoped = <T extends { store_number: string }>(rows: T[]): T[] =>
    scopeRef.current ? scopeToStoreNumber(rows, scopeRef.current) : rows;

  // The weekly and sub_sales chains run in parallel and both carry
  // store_number, so either can be first back. Whichever it is establishes the
  // locations; the other then scopes against the same answer instead of
  // racing it and deriving half the page combined and half scoped.
  const discoveredRef = useRef(false);
  const discoverLocations = (
    rows: { store_number: string }[],
    preferredNumber?: string | null,
  ) => {
    if (discoveredRef.current || rows.length === 0) return;
    discoveredRef.current = true;
    const numbers = storeNumbersIn(rows);
    dispatch(setAvailableStoreNumbers(numbers));
    // Default to the first location rather than the combined view — that's
    // what lines this page up with Sales, which has no combined row at all.
    if (numbers.length > 1) {
      const wanted =
        preferredNumber === null
          ? null
          : preferredNumber !== undefined && numbers.includes(preferredNumber)
            ? preferredNumber
            : numbers[0];
      scopeRef.current = wanted;
      dispatch(setSelectedStoreNumber(wanted));
    }
  };

  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);

  if (ctx.isMobile) return <SubDeptMarginsMobile />;

  // Re-present the cached search as a different location. No network — every
  // raw response is already in rawRef, including sub depts that only exist at
  // the other location.
  const handleStoreNumberChange = (storeNumber: string | null) => {
    scopeRef.current = storeNumber;
    dispatch(setSelectedStoreNumber(storeNumber));
    // rawRef is component-local, so a remount (route change, hot reload) empties
    // it while Redux still holds the results. Deriving from an empty cache would
    // overwrite Redux with an empty list and strand the user on the entry card,
    // so refetch instead — keeping the location just picked.
    if (rawRef.current.items.ty.length === 0) {
      handleSearch(storeNumber);
      return;
    }
    // The previously selected sub dept may not trade at this location.
    dispatch(actions.setSelectedSubDeptId(null));
    dispatch(resetSubDeptGrades());
    deriveFromItems();
  };

  /**
   * Everything the page shows, derived from the three item reads.
   *
   * Shared by the search and the location switch so the two cannot drift —
   * they used to hold two copies of this arithmetic, and a location switch
   * quietly recomputing something differently is the kind of fault nobody
   * reports because both numbers look plausible.
   */
  const deriveFromItems = () => {
    const raw = rawRef.current;
    const ty = scoped(raw.items.ty);
    const lw = scoped(raw.items.lw);
    const ly = scoped(raw.items.ly);

    // Store header, day-matched, summed from the same rows the departments are
    // built from — so the header and the list below it cannot disagree.
    dispatch(setStoreSalesTotals(computeStoreDayMatched(ty, lw, ly)));

    const salesTy = aggSubDeptSales(ty);
    const salesLw = aggSubDeptSales(lw);
    const salesLy = aggSubDeptSales(ly);

    const tyBy = groupBySubDept(ty);
    const lwBy = groupBySubDept(lw);
    const lyBy = groupBySubDept(ly);

    const subDepts = deriveSubDepts(ty);
    dispatch(actions.setSubDepts(subDepts));

    for (const sd of subDepts) {
      dispatch(
        setSubDeptGrade({
          id: sd.id,
          grade: computeSubDeptGrade(
            tyBy.get(sd.id) ?? [],
            lyBy.get(sd.id) ?? [],
            lwBy.get(sd.id) ?? [],
            {
              ty: salesTy[sd.id] ?? EMPTY_SALES,
              lw: salesLw[sd.id] ?? EMPTY_SALES,
              ly: salesLy[sd.id] ?? EMPTY_SALES,
            },
          ),
        }),
      );
    }
  };

  // preferredNumber keeps the user's chosen location across a forced refetch;
  // omitted on a fresh search, which defaults to the first location.
  const handleSearch = (preferredNumber?: string | null) => {
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setLoadingSubDepts(true));
    setNotice(undefined);
    rawRef.current = emptyRaw();
    scopeRef.current = null;
    discoveredRef.current = false;
    // Shift the whole selected window back 7 days. The old end-13 → end-7 form
    // ignored params.start, so any range that wasn't exactly 7 days fetched a
    // mismatched LW span.
    const lwStart = setDates(new Date(`${params.start}T12:00:00`), 7);
    const lwEnd = setDates(new Date(`${params.end}T12:00:00`), 7);

    /**
     * Two paginated `subs/subs` reads: the this-year/last-week span, and last
     * year.
     *
     * This is now the page's only source. It previously ran three
     * `sales/weekly` for the store header, three `subs/sub_sales` for the
     * department list and Sales-metric totals, and three-per-department
     * `subs/subs` for margin — nine calls plus a fan-out that put hundreds of
     * requests in flight from one search.
     *
     * Collapsing to one source is possible because the three endpoints were
     * reconciled on the backend: `subs/subs` now carries the `SUBD` ring type
     * alongside `ITEM`, so summing item rows gives the same store and
     * department totals the other two reported. Every field the page needs —
     * store number, date, department, sales, tax, quantity, cost — is on these
     * rows already.
     */
    dispatch(setLoadingGrades(true));

    Promise.all([
      // This year and last week in one read. Last week is the same window
      // shifted back seven days, so the two spans touch — and overlap once the
      // window runs longer than a week — which makes `[lwStart, end]` a single
      // continuous range covering both. Splitting it by date afterwards costs
      // nothing and gives exactly what two reads gave.
      //
      // On a 28-day window that is 35 days of rows instead of 56: fewer calls
      // and a smaller download, not a trade between them.
      fetchAllPages(
        ctx.url,
        ctx.token,
        ALL_SUB_DEPTS,
        lwStart,
        params.end,
        params.useGroups,
        params.searchValue,
        params.singleStore,
      ),
      // Last year cannot join them — it is a year away, not adjacent.
      fetchSafe(
        ctx.url,
        ctx.token,
        ALL_SUB_DEPTS,
        getLYDate(params.start),
        getLYDate(params.end),
        params.useGroups,
        params.searchValue,
        params.singleStore,
      ),
    ])
      .then(([span, ly]) => {
        // A row in the overlap belongs to both sets, which is what two separate
        // reads produced — the filters are independent, not a partition.
        const ty = inRange(span, params.start, params.end);
        const lw = inRange(span, lwStart, lwEnd);
        rawRef.current.items = { ty, lw, ly };

        if (ty.length === 0) {
          setNotice("No sub departments came back for this search.");
          return;
        }

        // Locations come off the same rows as everything else now, so the
        // page can no longer establish them from one endpoint and then
        // scope a second against a different answer.
        discoverLocations(ty, preferredNumber);
        deriveFromItems();
      })
      .catch((err: JsonError) => {
        dispatch(setStoreSalesTotals(null));
        toast.error(err.message ?? "Could not load sub department margins");
      })
      .finally(() => {
        dispatch(actions.setLoadingSubDepts(false));
        dispatch(setLoadingGrades(false));
      });
  };

  // Seed week 1 from pre-fetched grade when sub dept is selected, then lazy-fetch weeks 2-4
  /**
   * Seed the selected sub dept's weeks from the grade the search already built.
   *
   * This used to fire seven `subs/subs` calls. Six of them filled weeks 3 and 4
   * of TY and LY, read only by the `SmDev*` display components the `MarginPerf*`
   * refactor replaced — plus an LW week 4 that had no reader anywhere in the
   * codebase. The seventh fetched TY week 2, which is simply last week, and the
   * search had already put those rows in the grade as `lwWeekOneMargins`,
   * `scoped()` exactly the way the fetch was.
   *
   * So selecting a department now costs nothing: every figure on screen comes
   * out of state the search populated. Vendors has always worked this way, which
   * is why it never made this call.
   *
   * The `lastFetchedTrendKey` cache went with them. It existed only to stop
   * those fetches refiring on remount, and there is nothing left to refire.
   */
  useEffect(() => {
    if (ctx.selectedSubDeptId == null) return;
    const grade = subDeptGrades[ctx.selectedSubDeptId];
    if (!grade) return;

    dispatch(setWeekTrendMargins({ data: grade.tyWeekOneMargins, week: 1 }));
    dispatch(setWeekTrendMarginsLY({ data: grade.lyWeekOneMargins, week: 1 }));
    // Week 2 is last week — the day sidebar's LW column, and the only one of
    // the old weeks 2-4 anything still reads.
    dispatch(setWeekTrendMargins({ data: grade.lwWeekOneMargins, week: 2 }));
    dispatch(actions.setSelectedWeek(1));
    dispatch(actions.setSelectedWeekDay(""));
  }, [ctx.selectedSubDeptId]);

  useEffect(() => {
    dispatch(actions.resetFilters());
  }, [sm.subDeptGridView]);

  const handleClose = () => {
    dispatch(actions.setOpenExportModal(false));
    dispatch(actions.setOpenCostExportModal(false));
  };

  if (ctx.subDepts.length === 0 && !ctx.loadingSubDepts) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)]">
        <SmDevEntryCard onSearch={handleSearch} notice={notice} />
      </div>
    );
  }

  if (ctx.loadingSubDepts) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading sub departments..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <ExportModal
        resizable
        isOpen={sm.openExportModal}
        columns={itemCols}
        data={sm.filteredItemGridData}
        onClose={handleClose}
      />
      <ExportModal
        resizable
        isOpen={sm.openCostExportModal}
        columns={costCols}
        data={sm.filteredCostGridData}
        onClose={handleClose}
      />
      <ItemFilterModal />

      {searchOpen && (
        <SmDevSearchOverlay
          onSearch={() => {
            setSearchOpen(false);
            handleSearch();
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <MarginPerfLeftPanel
          onSearchOpen={() => setSearchOpen(true)}
          onStoreNumberChange={handleStoreNumberChange}
        />
        <MarginPerfRightPanel />
      </div>
    </div>
  );
};

export default SubDeptMarginsDev;
