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
  // Keyed by sub dept id. Populated for the UNION of sub depts across both
  // locations, so switching never needs data we didn't fetch.
  margins: Record<number, { ty: SubDeptMargin[]; ly: SubDeptMargin[]; lw: SubDeptMargin[] }>;
};

const emptyRaw = (): RawSearch => ({
  weekly: { tw: [], lw: [], ly: [] },
  subSales: { ty: [], lw: [], ly: [] },
  margins: {},
});

// No sub_department !== 0 filter — Sales doesn't exclude it (aggSubDepts takes
// every row), so dropping it here made this page show one fewer sub department
// and a lower total than Sales.
const deriveSubDepts = (rows: SubSale[]): SubDept[] =>
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
    dispatch(actions.setSelectedSubDeptId(null));
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

    const salesTy = aggSubDeptSales(scoped(raw.subSales.ty));
    const salesLw = aggSubDeptSales(scoped(raw.subSales.lw));
    const salesLy = aggSubDeptSales(scoped(raw.subSales.ly));
    const subDepts = deriveSubDepts(scoped(raw.subSales.ty));
    dispatch(actions.setSubDepts(subDepts));

    for (const sd of subDepts) {
      const m = raw.margins[sd.id];
      if (!m) continue;
      dispatch(
        setSubDeptGrade({
          id: sd.id,
          grade: computeSubDeptGrade(
            scoped(m.ty),
            scoped(m.ly),
            scoped(m.lw),
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
        const salesTy = aggSubDeptSales(scoped(rawRef.current.subSales.ty));
        const salesLw = aggSubDeptSales(scoped(rawRef.current.subSales.lw));
        const salesLy = aggSubDeptSales(scoped(rawRef.current.subSales.ly));
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

          for (const sd of allSubDepts) {
            Promise.all([
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
              fetchSafe(
                ctx.url,
                ctx.token,
                sd.id,
                // Shift the whole selected window back 7 days. The old
                // end-13 → end-7 form ignored params.start, so any range that
                // wasn't exactly 7 days fetched a mismatched LW span.
                setDates(new Date(`${params.start}T12:00:00`), 7),
                setDates(new Date(`${params.end}T12:00:00`), 7),
                params.useGroups,
                params.searchValue,
                params.singleStore,
              ),
            ])
              .then(([tyData, lyData, lwData]) => {
                rawRef.current.margins[sd.id] = {
                  ty: tyData,
                  ly: lyData,
                  lw: lwData,
                };
                // A dept that only trades at the other location has nothing to
                // show under the current scope — skip rather than grading it
                // against zeros.
                if (!subDepts.some((s) => s.id === sd.id)) return;
                dispatch(
                  setSubDeptGrade({
                    id: sd.id,
                    grade: computeSubDeptGrade(
                      scoped(tyData),
                      scoped(lyData),
                      scoped(lwData),
                      {
                        ty: salesTy[sd.id] ?? EMPTY_SALES,
                        lw: salesLw[sd.id] ?? EMPTY_SALES,
                        ly: salesLy[sd.id] ?? EMPTY_SALES,
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
    if (ctx.selectedSubDeptId == null) return;
    const grade = subDeptGrades[ctx.selectedSubDeptId];
    if (!grade) return;

    const e = params.end;
    const g = params.useGroups;
    const sv = params.searchValue;
    const ss = params.singleStore;
    const id = ctx.selectedSubDeptId;

    // Remounting with weeks 2-4 already fetched for this exact sub dept +
    // date range + search (e.g. navigating away and back) shouldn't blank
    // and re-fire those fetches — Redux still has the data.
    // Includes the location: co-located stores share a storeid, so without it
    // switching from 369 to 370 would keep 369's weeks 2-4 on screen.
    const trendKey = `${id}_${e}_${g}_${sv}_${ss}_${selectedStoreNumber ?? "all"}`;
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
    ).then((data) => dispatch(setWeekTrendMargins({ data: scoped(data), week: 2 })));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 20),
      setDates(new Date(e), 14),
      g,
      sv,
      ss,
    ).then((data) => dispatch(setWeekTrendMargins({ data: scoped(data), week: 3 })));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 27),
      setDates(new Date(e), 21),
      g,
      sv,
      ss,
    ).then((data) => dispatch(setWeekTrendMargins({ data: scoped(data), week: 4 })));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 377),
      setDates(new Date(e), 371),
      g,
      sv,
      ss,
    ).then((data) => dispatch(setWeekTrendMarginsLY({ data: scoped(data), week: 2 })));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 384),
      setDates(new Date(e), 378),
      g,
      sv,
      ss,
    ).then((data) => dispatch(setWeekTrendMarginsLY({ data: scoped(data), week: 3 })));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 391),
      setDates(new Date(e), 385),
      g,
      sv,
      ss,
    ).then((data) => dispatch(setWeekTrendMarginsLY({ data: scoped(data), week: 4 })));

    fetchSafe(
      ctx.url,
      ctx.token,
      id,
      setDates(new Date(e), 34),
      setDates(new Date(e), 28),
      g,
      sv,
      ss,
    ).then((data) => dispatch(setWeekTrendMarginsLW({ data: scoped(data), week: 4 })));
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
