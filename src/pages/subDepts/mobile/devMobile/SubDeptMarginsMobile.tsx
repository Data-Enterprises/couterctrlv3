import { useEffect, useRef, useState } from "react";
import {
  scopeToStoreNumber,
  storeNumbersIn,
} from "../../../../utils/storeIdentity";
import { useSubMarginCtx, useParams } from "../../hooks";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getSubDepts, getSubMargins } from "../../../../api/subMargins";
import {
  setDates,
  calculateCogs,
  hasNoUsableCost,
  getLYDate,
  distinctSubDepts,
  subDeptKeyMode,
  scopeToSubDept,
} from "../..";
import type {
  JsonError,
  SubSale,
  SubSalesJsonResp,
  SubMarginsJsonResp,
  SubDeptMargin,
} from "../../../../interfaces";
import {
  setSubDeptGrade,
  setLoadingGrades,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  resetSubDeptGrades,
  type SubDeptGrade,
} from "../../../../features/subMarginSlice";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import SingleStoreSearchCard from "../../../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../../../components/datePickers/SingleDatePicker";
import SubDeptListMobile from "./SubDeptListMobile";
import SubDeptItemsSheet from "./SubDeptItemsSheet";

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

const computeSubDeptGrade = (
  tyMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
): SubDeptGrade => {
  const tySales = tyMargins.reduce(
    (acc, m) => acc + (m.total_sales - m.total_tax),
    0,
  );
  const tyCogs = tyMargins.reduce(
    (acc, m) =>
      acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );
  const lySales = lyMargins.reduce(
    (acc, m) => acc + (m.total_sales - m.total_tax),
    0,
  );
  const lyCogs = lyMargins.reduce(
    (acc, m) =>
      acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );
  const lwSales = lwMargins.reduce(
    (acc, m) => acc + (m.total_sales - m.total_tax),
    0,
  );
  const lwCogs = lwMargins.reduce(
    (acc, m) =>
      acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );
  const tyMarginPct = tySales > 0 ? ((tySales - tyCogs) / tySales) * 100 : 0;
  const lyMarginPct = lySales > 0 ? ((lySales - lyCogs) / lySales) * 100 : 0;
  const lwMarginPct = lwSales > 0 ? ((lwSales - lwCogs) / lwSales) * 100 : 0;
  const ptsDelta = lyMarginPct > 0 ? tyMarginPct - lyMarginPct : 0;
  const lwPtsDelta = lwMarginPct > 0 ? tyMarginPct - lwMarginPct : 0;
  const seen = new Set<string>();
  let noCostCount = 0;
  for (const m of tyMargins) {
    if (!seen.has(m.product_code)) {
      seen.add(m.product_code);
      if (hasNoUsableCost(m)) noCostCount++;
    }
  }
  const vsLYSalesPct = lySales > 0 ? ((tySales - lySales) / lySales) * 100 : 0;
  const vsLWSalesPct = lwSales > 0 ? ((tySales - lwSales) / lwSales) * 100 : 0;
  return {
    tyMarginPct,
    lyMarginPct,
    ptsDelta,
    noCostCount,
    tySales,
    lySales,
    vsLYSalesPct,
    lwSales,
    lwMarginPct,
    lwPtsDelta,
    vsLWSalesPct,
    tyWeekOneMargins: tyMargins,
    lyWeekOneMargins: lyMargins,
    lwWeekOneMargins: lwMargins,
  };
};

export type GradingProgress = { completed: number; total: number };

const SubDeptMarginsMobile = () => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const toast = useToast();
  const [gradingProgress, setGradingProgress] = useState<GradingProgress>({
    completed: 0,
    total: 0,
  });
  const [notice, setNotice] = useState<string | undefined>(undefined);
  // Re-search opens the entry card rather than refetching the current store
  // and date on the spot — the whole point is to pick different ones. Data
  // is left intact so "Back to results" can return without a fetch, matching
  // Receivers mobile.
  const [showSearch, setShowSearch] = useState(false);

  // Raw responses for the current search, so switching co-located locations
  // re-derives instantly instead of refetching 1 + 3xN calls.
  const rawRef = useRef<{
    subSales: SubSale[];
    // Keyed by sub dept key — the id, or the description where departments
    // aren't numbered. See utils/subDeptIdentity.
    margins: Record<
      string,
      { ty: SubDeptMargin[]; ly: SubDeptMargin[]; lw: SubDeptMargin[] }
    >;
  }>({ subSales: [], margins: {} });
  const selectedStoreNumber = useAppSelector(
    (s) => s.subMargin.selectedStoreNumber,
  );
  const scopeRef = useRef<string | null>(selectedStoreNumber);
  scopeRef.current = selectedStoreNumber;
  const scoped = <T extends { store_number: string }>(rows: T[]): T[] =>
    scopeRef.current ? scopeToStoreNumber(rows, scopeRef.current) : rows;

  // Re-present the cached search as a different location. No network.
  //
  // rawRef is component-local, so anything that remounts this component (route
  // change, hot reload) empties it while Redux still holds the results. Without
  // this guard the switch would derive an empty list from the empty cache and
  // overwrite Redux with it, dropping the user on the entry card with nothing
  // to go back to. On a cold cache, refetch instead — keeping the location the
  // user just picked.
  const handleStoreNumberChange = (storeNumber: string | null) => {
    scopeRef.current = storeNumber;
    dispatch(setSelectedStoreNumber(storeNumber));
    if (rawRef.current.subSales.length === 0) {
      handleSearch(storeNumber);
      return;
    }
    dispatch(actions.setSelectedSubDeptKey(null));
    dispatch(resetSubDeptGrades());
    const raw = rawRef.current;
    const subDepts = distinctSubDepts(scoped(raw.subSales));
    dispatch(actions.setSubDepts(subDepts));
    for (const sd of subDepts) {
      const m = raw.margins[sd.key];
      if (!m) continue;
      dispatch(
        setSubDeptGrade({
          key: sd.key,
          grade: computeSubDeptGrade(scoped(m.ty), scoped(m.ly), scoped(m.lw)),
        }),
      );
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // preferredNumber keeps the user's chosen location across a forced refetch;
  // omitted on a fresh search, which defaults to the first location.
  const handleSearch = (preferredNumber?: string | null) => {
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setLoadingSubDepts(true));
    setGradingProgress({ completed: 0, total: 0 });
    setNotice(undefined);
    rawRef.current = { subSales: [], margins: {} };
    scopeRef.current = null;

    getSubDepts(
      ctx.url,
      ctx.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubSalesJsonResp = resp.data;
        if (j.error !== 0) {
          setNotice("No sub departments came back for this search");
          return;
        }
        rawRef.current.subSales = j.subs;
        // Co-located stores share a storeid and this is fetched by storeid, so
        // the response covers both locations. Default to the first, matching
        // desktop. See utils/storeIdentity.
        const numbers = storeNumbersIn(j.subs);
        dispatch(setAvailableStoreNumbers(numbers));
        if (numbers.length > 1) {
          const wanted =
            preferredNumber !== undefined &&
            preferredNumber !== null &&
            numbers.includes(preferredNumber)
              ? preferredNumber
              : preferredNumber === null
                ? null
                : numbers[0];
          scopeRef.current = wanted;
          dispatch(setSelectedStoreNumber(wanted));
        }
        // No sub_department !== 0 filter — kept in step with desktop and with
        // Sales, which doesn't exclude it either.
        const subDepts = distinctSubDepts(scoped(j.subs));

        dispatch(actions.setSubDepts(subDepts));

        // Fetch margins for the union of both locations so switching never
        // needs data we didn't request; only the display list is scoped.
        const allSubDepts = distinctSubDepts(j.subs);
        // How this search identifies a department — id, or description where
        // the company doesn't number them. See utils/subDeptIdentity.
        const mode = subDeptKeyMode(j.subs);

        const total = allSubDepts.length;
        if (total === 0) {
          setNotice("No sub departments came back for this search.");
          return;
        }

        dispatch(setLoadingGrades(true));
        setGradingProgress({ completed: 0, total });
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
              setDates(new Date(params.end), 13),
              setDates(new Date(params.end), 7),
              params.useGroups,
              params.searchValue,
              params.singleStore,
            ),
          ])
            .then(([tyAll, lyAll, lwAll]) => {
              // Pass-through when the API filtered by a real id; narrows by
              // description when every id was 0 and it returned everything.
              const tyData = scopeToSubDept(tyAll, sd.key, mode);
              const lyData = scopeToSubDept(lyAll, sd.key, mode);
              const lwData = scopeToSubDept(lwAll, sd.key, mode);
              rawRef.current.margins[sd.key] = {
                ty: tyData,
                ly: lyData,
                lw: lwData,
              };
              // A dept that only trades at the other location has nothing to
              // show under the current scope.
              if (!subDepts.some((d) => d.key === sd.key)) return;
              dispatch(
                setSubDeptGrade({
                  key: sd.key,
                  grade: computeSubDeptGrade(
                    scoped(tyData),
                    scoped(lyData),
                    scoped(lwData),
                  ),
                }),
              );
            })
            .catch((err: JsonError) =>
              toast.error(`${sd.desc}: ${err.message}`),
            )
            .finally(() => {
              completed++;
              setGradingProgress({ completed, total });
              if (completed === total) dispatch(setLoadingGrades(false));
            });
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setLoadingSubDepts(false)));
  };

  if (ctx.subDepts.length > 0 && !showSearch) {
    return (
      <>
        <SubDeptListMobile
          onSearch={() => setShowSearch(true)}
          gradingProgress={gradingProgress}
          onStoreNumberChange={handleStoreNumberChange}
        />
        {/* null, not 0 — 0 is a real sub department id, so a truthiness test
            would never open it. See selectedSubDeptKey in subMarginSlice. */}
        {ctx.selectedSubDeptKey != null && (
          <SubDeptItemsSheet
            onBack={() => dispatch(actions.setSelectedSubDeptKey(null))}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto">
      <div className="mx-4 pt-4 pb-2">
        <SingleStoreSearchCard
          title="Sub Dept Margins"
          description="Select a store and week ending date to grade sub departments."
          buttonLabel="Load sub departments"
          stores={ctx.assignedStores}
          selectedStoreId={ctx.searchValue}
          onStoreSelect={(id) => dispatch(actions.setSearchValue(id))}
          onSearch={() => {
            setShowSearch(false);
            handleSearch();
          }}
          loading={ctx.loadingSubDepts}
          loadingMessage="Finding sub dept margins..."
          datePicker={<SingleDatePicker />}
          notice={notice}
        >
          {ctx.subDepts.length > 0 && (
            <button
              onClick={() => setShowSearch(false)}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: "rgba(30,42,74,0.07)", borderRadius: 10 }}
            >
              <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
              <span className="text-[#1e2a4a] font-semibold text-[13px] underline underline-offset-2">
                Back to results
              </span>
            </button>
          )}
        </SingleStoreSearchCard>
      </div>
    </div>
  );
};

export default SubDeptMarginsMobile;
