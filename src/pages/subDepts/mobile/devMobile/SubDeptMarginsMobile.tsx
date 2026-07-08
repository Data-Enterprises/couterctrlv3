import { useEffect, useState } from "react";
import { useSubMarginCtx, useParams } from "../../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getSubDepts, getSubMargins } from "../../../../api/subMargins";
import { setDates, calculateCogs, getLYDate } from "../..";
import type {
  JsonError,
  SubDept,
  SubSalesJsonResp,
  SubMarginsJsonResp,
  SubDeptMargin,
} from "../../../../interfaces";
import {
  setSubDeptGrade,
  setLoadingGrades,
  type SubDeptGrade,
} from "../../../../features/subMarginSlice";
import SingleStoreSearchCard from "../../../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../../../components/datePickers/SingleDatePicker";
import SubDeptListMobile from "./SubDeptListMobile";
import SubDeptReportMobile from "./SubDeptReportMobile";

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
      if (m.case_size === 0 || (m.net_cost === 0 && m.cost === 0))
        noCostCount++;
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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSearch = () => {
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setLoadingSubDepts(true));
    setGradingProgress({ completed: 0, total: 0 });
    setNotice(undefined);

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
        const subDepts = j.subs
          .reduce((acc: SubDept[], curr) => {
            if (
              curr.sub_department !== 0 &&
              !acc.some((s) => s.id === curr.sub_department)
            ) {
              acc.push({
                id: curr.sub_department,
                desc: curr.sub_department_description,
              });
            }
            return acc;
          }, [])
          .sort((a, b) => a.id - b.id);

        dispatch(actions.setSubDepts(subDepts));

        const total = subDepts.length;
        if (total === 0) {
          setNotice("No sub departments came back for this search.");
          return;
        }

        dispatch(setLoadingGrades(true));
        setGradingProgress({ completed: 0, total });
        let completed = 0;

        for (const sd of subDepts) {
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
            .then(([tyData, lyData, lwData]) => {
              dispatch(
                setSubDeptGrade({
                  id: sd.id,
                  grade: computeSubDeptGrade(tyData, lyData, lwData),
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

  if (ctx.selectedSubDeptId > 0) {
    return (
      <SubDeptReportMobile
        onBack={() => dispatch(actions.setSelectedSubDeptId(0))}
      />
    );
  }

  if (ctx.subDepts.length > 0) {
    return (
      <SubDeptListMobile
        onSearch={handleSearch}
        gradingProgress={gradingProgress}
      />
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
          onSearch={handleSearch}
          loading={ctx.loadingSubDepts}
          datePicker={<SingleDatePicker />}
          notice={notice}
        />
      </div>
    </div>
  );
};

export default SubDeptMarginsMobile;
