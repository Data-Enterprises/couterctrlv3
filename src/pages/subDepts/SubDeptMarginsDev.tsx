import { useEffect, useState } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useSubMarginActions } from "./hooks/useSubMarginActions";
import { useSubMarginState } from "./hooks/useSubMarginState";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSubDepts, getSubMargins } from "../../api/subMargins";
import { useParams } from "./hooks";
import { setDates, calculateCogs } from ".";
import type { JsonError, SubDept, SubSalesJsonResp, SubMarginsJsonResp, SubDeptMargin } from "../../interfaces";
import {
  setSubDeptGrade,
  setLoadingGrades,
  setWeekTrendMargins,
  setWeekTrendMarginsLY,
  setWeekTrendMarginsLW,
  type SubDeptGrade,
} from "../../features/subMarginSlice";

import MarginPerfLeftPanel from "./display/dev/MarginPerfLeftPanel";
import MarginPerfRightPanel from "./display/dev/MarginPerfRightPanel";
import SmDevSearchOverlay from "./display/dev/SmDevSearchOverlay";
import SmDevEntryCard from "./display/dev/SmDevEntryCard";
import ItemFilterModal from "./display/modals/ItemFilterModal";
import ExportModal from "../../components/modals/ExportModal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { costCols, itemCols } from "./display/widgets";
import CtxMenu from "../../components/CtxMenu";
import { setMenuPosition } from "../../features/ctxMenuSlice";
import type { Handlers } from "../../interfaces";
import { smOptions } from "../upc/utils";

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
  const resp = await getSubMargins(url, token, subDeptId, start, end, useGroups, searchValue, singleStore);
  const j: SubMarginsJsonResp = resp.data;
  if (j.error !== 0) throw new Error(j.msg ?? "Failed to load margins");
  let data: SubDeptMargin[] = j.subs;
  if (j.total_pages > 1) {
    const extras = await Promise.all(
      Array.from({ length: j.total_pages - 1 }, (_, i) =>
        getSubMargins(url, token, subDeptId, start, end, useGroups, searchValue, singleStore, i + 2),
      ),
    );
    for (const r of extras) {
      const pj: SubMarginsJsonResp = r.data;
      if (pj.error === 0) data = [...data, ...pj.subs];
    }
  }
  return data;
};

const computeSubDeptGrade = (tyMargins: SubDeptMargin[], lyMargins: SubDeptMargin[], lwMargins: SubDeptMargin[]): SubDeptGrade => {
  const tySales = tyMargins.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const tyCogs = tyMargins.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
  const lySales = lyMargins.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const lyCogs = lyMargins.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
  const lwSales = lwMargins.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const lwCogs = lwMargins.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
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
      if (m.case_size === 0 || (m.net_cost === 0 && m.cost === 0)) noCostCount++;
    }
  }
  const vsLYSalesPct = lySales > 0 ? ((tySales - lySales) / lySales) * 100 : 0;
  const vsLWSalesPct = lwSales > 0 ? ((tySales - lwSales) / lwSales) * 100 : 0;
  return { tyMarginPct, lyMarginPct, ptsDelta, noCostCount, tySales, lySales, vsLYSalesPct, lwSales, lwMarginPct, lwPtsDelta, vsLWSalesPct, tyWeekOneMargins: tyMargins, lyWeekOneMargins: lyMargins, lwWeekOneMargins: lwMargins };
};

const SubDeptMarginsDev = () => {
  const ctx = useSubMarginCtx();
  const context = useAppSelector((state) => state.ctxMenu);
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useSubMarginState();
  const toast = useToast();
  const params = useParams();
  const [searchOpen, setSearchOpen] = useState(false);

  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);

  const handleSearch = () => {
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setLoadingSubDepts(true));
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
          toast.warn(j.msg);
          return;
        }
        if (j.error === 0) {
          const subDepts = j.subs
            .reduce((acc: SubDept[], curr) => {
              if (curr.sub_department !== 0 && !acc.some((s) => s.id === curr.sub_department)) {
                acc.push({ id: curr.sub_department, desc: curr.sub_department_description });
              }
              return acc;
            }, [])
            .sort((a, b) => a.id - b.id);
          dispatch(actions.setSubDepts(subDepts));

          const total = subDepts.length;
          if (total === 0) {
            toast.warn("No sub departments found for this search");
            return;
          }
          dispatch(setLoadingGrades(true));
          let completed = 0;

          for (const sd of subDepts) {
            Promise.all([
              fetchAllPages(ctx.url, ctx.token, sd.id, params.start, params.end, params.useGroups, params.searchValue, params.singleStore),
              fetchAllPages(ctx.url, ctx.token, sd.id, setDates(new Date(params.start), 364), setDates(new Date(params.end), 364), params.useGroups, params.searchValue, params.singleStore),
              fetchAllPages(ctx.url, ctx.token, sd.id, setDates(new Date(params.end), 13), setDates(new Date(params.end), 7), params.useGroups, params.searchValue, params.singleStore),
            ])
              .then(([tyData, lyData, lwData]) => {
                dispatch(setSubDeptGrade({ id: sd.id, grade: computeSubDeptGrade(tyData, lyData, lwData) }));
              })
              .catch((err: JsonError) => toast.error(`${sd.desc}: ${err.message}`))
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
    if (!ctx.selectedSubDeptId) return;
    const grade = subDeptGrades[ctx.selectedSubDeptId];
    if (!grade) return;

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

    const e = params.end;
    const g = params.useGroups;
    const sv = params.searchValue;
    const ss = params.singleStore;
    const id = ctx.selectedSubDeptId;

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 13), setDates(new Date(e), 7), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMargins({ data, week: 2 })))
      .catch((err: JsonError) => toast.error(err.message));

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 20), setDates(new Date(e), 14), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMargins({ data, week: 3 })))
      .catch((err: JsonError) => toast.error(err.message));

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 27), setDates(new Date(e), 21), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMargins({ data, week: 4 })))
      .catch((err: JsonError) => toast.error(err.message));

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 377), setDates(new Date(e), 371), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMarginsLY({ data, week: 2 })))
      .catch((err: JsonError) => toast.error(err.message));

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 384), setDates(new Date(e), 378), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMarginsLY({ data, week: 3 })))
      .catch((err: JsonError) => toast.error(err.message));

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 391), setDates(new Date(e), 385), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMarginsLY({ data, week: 4 })))
      .catch((err: JsonError) => toast.error(err.message));

    fetchAllPages(ctx.url, ctx.token, id, setDates(new Date(e), 34), setDates(new Date(e), 28), g, sv, ss)
      .then((data) => dispatch(setWeekTrendMarginsLW({ data, week: 4 })))
      .catch((err: JsonError) => toast.error(err.message));
  }, [ctx.selectedSubDeptId]);

  useEffect(() => {
    dispatch(actions.resetFilters());
  }, [sm.subDeptGridView]);


  const handleClose = () => {
    dispatch(actions.setOpenExportModal(false));
    dispatch(actions.setOpenCostExportModal(false));
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    dispatch(setMenuPosition(null));
  };

  const handlers: Handlers = {
    copyUpc: () => handleCopy(context.smClipboardText.upc),
    copyAllUpcs: () => handleCopy(context.smClipboardText.allUpc),
  };

  if (ctx.subDepts.length === 0 && !ctx.loadingSubDepts) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)]">
        <CtxMenu handlers={handlers} options={smOptions} />
        <SmDevEntryCard onSearch={handleSearch} />
      </div>
    );
  }

  if (ctx.loadingSubDepts) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <CtxMenu handlers={handlers} options={smOptions} />
        <LoadingIndicator message="Loading sub departments..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <CtxMenu handlers={handlers} options={smOptions} />
      <ExportModal
        isOpen={sm.openExportModal}
        columns={itemCols}
        data={sm.filteredItemGridData}
        onClose={handleClose}
      />
      <ExportModal
        isOpen={sm.openCostExportModal}
        columns={costCols}
        data={sm.filteredCostGridData}
        onClose={handleClose}
      />
      <ItemFilterModal />

      {searchOpen && (
        <SmDevSearchOverlay
          onSearch={() => { setSearchOpen(false); handleSearch(); }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <MarginPerfLeftPanel onSearchOpen={() => setSearchOpen(true)} />
        <MarginPerfRightPanel />
      </div>
    </div>
  );
};

export default SubDeptMarginsDev;
