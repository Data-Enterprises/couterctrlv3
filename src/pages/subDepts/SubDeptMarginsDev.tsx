import { useEffect, useRef, useState } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useSubMarginActions } from "./hooks/useSubMarginActions";
import { useSubMarginState } from "./hooks/useSubMarginState";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSubDepts, getSubMargins } from "../../api/subMargins";
import { getWeekly } from "../../api/sales";
import { useParams } from "./hooks";
import {
  setDates,
  hasNoUsableCost,
  getLYDate,
  computeMarginDayMatched,
  computeStoreDayMatched,
  aggSubDeptSales,
  distinctSubDepts,
  subDeptKeyMode,
  scopeToSubDept,
  type SubDeptSalesTotals,
} from ".";
import type {
  JsonError,
  SubDept,
  SubSale,
  SubSalesJsonResp,
  SubMarginsJsonResp,
  SubDeptMargin,
  WeeklySale,
} from "../../interfaces";
import {
  scopeToStoreNumber,
  storeNumbersIn,
} from "../../utils/storeIdentity";
import {
  setSubDeptGrade,
  setLoadingGrades,
  setStoreSalesTotals,
  setWeekTrendMargins,
  setWeekTrendMarginsLY,
  setWeekTrendMarginsLW,
  setLastFetchedTrendKey,
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

const EMPTY_SALES: SubDeptSalesTotals = { net: 0, qty: 0 };

// Every raw response from one search, kept so switching between co-located
// locations can re-derive instantly. A refetch would cost 3 weekly + 3
// sub_sales + 3xN paginated subs/subs calls — far too much for a toggle.
type RawSearch = {
  weekly: { tw: WeeklySale[]; lw: WeeklySale[]; ly: WeeklySale[] };
  subSales: { ty: SubSale[]; lw: SubSale[]; ly: SubSale[] };
  // Keyed by sub dept key (id, or description where departments aren't
  // numbered). Populated for the UNION of sub depts across both locations, so
  // switching never needs data we didn't fetch.
  margins: Record<string, { ty: SubDeptMargin[]; ly: SubDeptMargin[]; lw: SubDeptMargin[] }>;
};

const emptyRaw = (): RawSearch => ({
  weekly: { tw: [], lw: [], ly: [] },
  subSales: { ty: [], lw: [], ly: [] },
  margins: {},
});

// No sub_department !== 0 filter — Sales doesn't exclude it (aggSubDepts takes
// every row), so dropping it here made this page show one fewer sub department
// and a lower total than Sales.
//
// Identity comes from distinctSubDepts, which keys on the id where the company
// numbers its departments and on the description where it doesn't — the whole
// list otherwise collapses to a single "0" row worth the entire store.
const deriveSubDepts = (rows: SubSale[]): SubDept[] => distinctSubDepts(rows);

const pctChange = (ty: number, ref: number) =>
  ref > 0 ? ((ty - ref) / ref) * 100 : 0;

const computeSubDeptGrade = (
  tyMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
  sales: { ty: SubDeptSalesTotals; lw: SubDeptSalesTotals; ly: SubDeptSalesTotals },
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
  const lastFetchedTrendKey = useAppSelector(
    (s) => s.subMargin.lastFetchedTrendKey,
  );

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
    if (rawRef.current.subSales.ty.length === 0) {
      handleSearch(storeNumber);
      return;
    }
    // The previously selected sub dept may not trade at this location.
    dispatch(actions.setSelectedSubDeptKey(null));
    dispatch(resetSubDeptGrades());

    const raw = rawRef.current;
    dispatch(
      setStoreSalesTotals(
        computeStoreDayMatched(
          scoped(raw.weekly.tw),
          scoped(raw.weekly.lw),
          scoped(raw.weekly.ly),
        ),
      ),
    );

    // Both periods bucketed the way THIS search's data identifies departments.
    const mode = subDeptKeyMode(raw.subSales.ty);
    const salesTy = aggSubDeptSales(scoped(raw.subSales.ty), mode);
    const salesLw = aggSubDeptSales(scoped(raw.subSales.lw), mode);
    const salesLy = aggSubDeptSales(scoped(raw.subSales.ly), mode);
    const subDepts = deriveSubDepts(scoped(raw.subSales.ty));
    dispatch(actions.setSubDepts(subDepts));

    for (const sd of subDepts) {
      const m = raw.margins[sd.key];
      if (!m) continue;
      dispatch(
        setSubDeptGrade({
          key: sd.key,
          grade: computeSubDeptGrade(
            scoped(m.ty),
            scoped(m.ly),
            scoped(m.lw),
            {
              ty: salesTy[sd.key] ?? EMPTY_SALES,
              lw: salesLw[sd.key] ?? EMPTY_SALES,
              ly: salesLy[sd.key] ?? EMPTY_SALES,
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
    // Store-level header figure comes from sales/weekly, day-matched — the
    // same source and method the Sales page header uses. Summing sub
    // departments gives a different number and can't be made to agree.
    const lwStart = setDates(new Date(`${params.start}T12:00:00`), 7);
    const lwEnd = setDates(new Date(`${params.end}T12:00:00`), 7);
    const weeklyFor = (start: string, end: string) =>
      getWeekly(
        ctx.url,
        ctx.token,
        start,
        end,
        params.useGroups,
        params.searchValue,
        params.singleStore,
      ).catch(() => null);

    Promise.all([
      weeklyFor(params.start, params.end),
      weeklyFor(lwStart, lwEnd),
      weeklyFor(getLYDate(params.start), getLYDate(params.end)),
    ])
      .then(([tw, lw, ly]) => {
        const rows = (r: typeof tw) =>
          r?.data?.error === 0 ? r.data.sales : [];
        rawRef.current.weekly = {
          tw: rows(tw),
          lw: rows(lw),
          ly: rows(ly),
        };
        discoverLocations(rawRef.current.weekly.tw, preferredNumber);
        dispatch(
          setStoreSalesTotals(
            computeStoreDayMatched(
              scoped(rawRef.current.weekly.tw),
              scoped(rawRef.current.weekly.lw),
              scoped(rawRef.current.weekly.ly),
            ),
          ),
        );
      })
      .catch(() => dispatch(setStoreSalesTotals(null)));

    // Three sub_sales calls (TY/LW/LY) rather than one — this is the source
    // for every Sales-metric total, so LW and LY are needed here, not just the
    // sub-department list. Cheap next to the 3xN subs/subs calls below.
    const subSalesFor = (start: string, end: string) =>
      getSubDepts(
        ctx.url,
        ctx.token,
        start,
        end,
        params.useGroups,
        params.searchValue,
        params.singleStore,
      ).catch(() => null);

    Promise.all([
      subSalesFor(params.start, params.end),
      subSalesFor(lwStart, lwEnd),
      subSalesFor(getLYDate(params.start), getLYDate(params.end)),
    ])
      .then(([tyResp, lwResp, lyResp]) => {
        const j: SubSalesJsonResp | undefined = tyResp?.data;
        if (!j || j.error !== 0) {
          setNotice("No sub departments came back for this search");
          return;
        }
        rawRef.current.subSales = {
          ty: j.subs,
          lw: lwResp?.data?.error === 0 ? lwResp.data.subs : [],
          ly: lyResp?.data?.error === 0 ? lyResp.data.subs : [],
        };
        discoverLocations(j.subs, preferredNumber);
        // One mode for the whole search: derived from this year's rows, then
        // applied to LW and LY so their totals land on the matching row even
        // when the older data still carries real department numbers.
        const mode = subDeptKeyMode(rawRef.current.subSales.ty);
        const salesTy = aggSubDeptSales(scoped(rawRef.current.subSales.ty), mode);
        const salesLw = aggSubDeptSales(scoped(rawRef.current.subSales.lw), mode);
        const salesLy = aggSubDeptSales(scoped(rawRef.current.subSales.ly), mode);
        {
          // Displayed list is scoped to the selected location; the fetch loop
          // below still walks the unscoped union, so switching locations never
          // needs data we didn't request.
          const subDepts = deriveSubDepts(scoped(j.subs));
          const allSubDepts = deriveSubDepts(j.subs);
          dispatch(actions.setSubDepts(subDepts));

          const total = allSubDepts.length;
          if (total === 0) {
            setNotice("No sub departments came back for this search.");
            return;
          }
          dispatch(setLoadingGrades(true));
          let completed = 0;

          // The endpoint filters by department NUMBER. Where the company
          // doesn't number its departments every sd.id is 0, so all N requests
          // for a period are the same request and each comes back carrying the
          // whole store — share one in-flight promise per (id, window) instead
          // of firing N identical ones, then split the result by description
          // below. In the numbered case every key is distinct and this is the
          // same N requests as before.
          const inFlight = new Map<string, Promise<SubDeptMargin[]>>();
          const fetchOnce = (
            id: number,
            start: string,
            end: string,
            run: () => Promise<SubDeptMargin[]>,
          ) => {
            const cacheKey = `${id}_${start}_${end}`;
            const hit = inFlight.get(cacheKey);
            if (hit) return hit;
            const p = run();
            inFlight.set(cacheKey, p);
            return p;
          };

          const lwStartDate = setDates(new Date(`${params.start}T12:00:00`), 7);
          const lwEndDate = setDates(new Date(`${params.end}T12:00:00`), 7);

          for (const sd of allSubDepts) {
            Promise.all([
              fetchOnce(sd.id, params.start, params.end, () =>
                fetchAllPages(
                  ctx.url,
                  ctx.token,
                  sd.id,
                  params.start,
                  params.end,
                  params.useGroups,
                  params.searchValue,
                  params.singleStore,
                ),
              ),
              fetchOnce(sd.id, getLYDate(params.start), getLYDate(params.end), () =>
                fetchSafe(
                  ctx.url,
                  ctx.token,
                  sd.id,
                  getLYDate(params.start),
                  getLYDate(params.end),
                  params.useGroups,
                  params.searchValue,
                  params.singleStore,
                ),
              ),
              // Shift the whole selected window back 7 days. The old
              // end-13 → end-7 form ignored params.start, so any range that
              // wasn't exactly 7 days fetched a mismatched LW span.
              fetchOnce(sd.id, lwStartDate, lwEndDate, () =>
                fetchSafe(
                  ctx.url,
                  ctx.token,
                  sd.id,
                  lwStartDate,
                  lwEndDate,
                  params.useGroups,
                  params.searchValue,
                  params.singleStore,
                ),
              ),
            ])
              .then(([tyAll, lyAll, lwAll]) => {
                // Pass-through when the API already filtered by a real id;
                // narrows by description when it couldn't. Without this every
                // department would be graded on the whole store's margins.
                const tyData = scopeToSubDept(tyAll, sd.key, mode);
                const lyData = scopeToSubDept(lyAll, sd.key, mode);
                const lwData = scopeToSubDept(lwAll, sd.key, mode);
                rawRef.current.margins[sd.key] = {
                  ty: tyData,
                  ly: lyData,
                  lw: lwData,
                };
                // A dept that only trades at the other location has nothing to
                // show under the current scope — skip rather than grading it
                // against zeros.
                if (!subDepts.some((s) => s.key === sd.key)) return;
                dispatch(
                  setSubDeptGrade({
                    key: sd.key,
                    grade: computeSubDeptGrade(
                      scoped(tyData),
                      scoped(lyData),
                      scoped(lwData),
                      {
                        ty: salesTy[sd.key] ?? EMPTY_SALES,
                        lw: salesLw[sd.key] ?? EMPTY_SALES,
                        ly: salesLy[sd.key] ?? EMPTY_SALES,
                      },
                    ),
                  }),
                );
              })
              .catch((err: JsonError) =>
                toast.error(`${sd.desc}: ${err.message}`),
              )
              .finally(() => {
                completed++;
                if (completed === total) dispatch(setLoadingGrades(false));
              });
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setLoadingSubDepts(false)));
  };

  // Seed week 1 from pre-fetched grade when sub dept is selected, then lazy-fetch weeks 2-4
  useEffect(() => {
    if (ctx.selectedSubDeptKey == null) return;
    const grade = subDeptGrades[ctx.selectedSubDeptKey];
    if (!grade) return;

    const e = params.end;
    const g = params.useGroups;
    const sv = params.searchValue;
    const ss = params.singleStore;
    const key = ctx.selectedSubDeptKey;
    // The endpoint filters by department NUMBER, which is 0 for every
    // department at a company that doesn't number them — so the request comes
    // back carrying all of them and `scopedToDept` below narrows it by
    // description. In the numbered case the id is the real one and the extra
    // filter is a pass-through.
    const dept = ctx.subDepts.find((s) => s.key === key);
    const id = dept?.id ?? 0;
    // Location scoping and department scoping in one place, so no week can be
    // stored having had only one of them applied.
    const scopedToDept = (rows: SubDeptMargin[]) =>
      scopeToSubDept(scoped(rows), key, subDeptKeyMode(rows));

    // Remounting with weeks 2-4 already fetched for this exact sub dept +
    // date range + search (e.g. navigating away and back) shouldn't blank
    // and re-fire those fetches — Redux still has the data.
    // Includes the location: co-located stores share a storeid, so without it
    // switching from 369 to 370 would keep 369's weeks 2-4 on screen.
    const trendKey = `${key}_${e}_${g}_${sv}_${ss}_${selectedStoreNumber ?? "all"}`;
    if (lastFetchedTrendKey === trendKey) return;

    dispatch(setWeekTrendMargins({ data: grade.tyWeekOneMargins, week: 1 }));
    dispatch(setWeekTrendMarginsLY({ data: grade.lyWeekOneMargins, week: 1 }));
    dispatch(setWeekTrendMargins({ data: [], week: 2 }));
    dispatch(setWeekTrendMargins({ data: [], week: 3 }));
    dispatch(setWeekTrendMargins({ data: [], week: 4 }));
    dispatch(setWeekTrendMarginsLY({ data: [], week: 2 }));
    dispatch(setWeekTrendMarginsLY({ data: [], week: 3 }));
    dispatch(setWeekTrendMarginsLY({ data: [], week: 4 }));
    dispatch(setWeekTrendMarginsLW({ data: [], week: 4 }));
    dispatch(actions.setSelectedWeek(1));
    dispatch(actions.setSelectedWeekDay(""));
    dispatch(setLastFetchedTrendKey(trendKey));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 13),
      setDates(new Date(e), 7),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMargins({ data: scopedToDept(data), week: 2 })),
    );

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 20),
      setDates(new Date(e), 14),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMargins({ data: scopedToDept(data), week: 3 })),
    );

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 27),
      setDates(new Date(e), 21),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMargins({ data: scopedToDept(data), week: 4 })),
    );

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 377),
      setDates(new Date(e), 371),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMarginsLY({ data: scopedToDept(data), week: 2 })),
    );

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 384),
      setDates(new Date(e), 378),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMarginsLY({ data: scopedToDept(data), week: 3 })),
    );

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 391),
      setDates(new Date(e), 385),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMarginsLY({ data: scopedToDept(data), week: 4 })),
    );

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 34),
      setDates(new Date(e), 28),
      g,
      sv,
      ss,
    ).then((data) =>
      dispatch(setWeekTrendMarginsLW({ data: scopedToDept(data), week: 4 })),
    );
  }, [ctx.selectedSubDeptKey]);

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
