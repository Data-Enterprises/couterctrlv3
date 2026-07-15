import { useMemo, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
// import { useSalesState } from "../hooks/useSalesState";
import { getSubs, getHourly } from "../../../api/sales";
import { getSubMargins } from "../../../api/subMargins";
import {
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
  formatCurrency2,
} from "../../../utils";
import {
  setReportLoading,
  setTop10Loading,
  setRawSubs,
  setRawLWSubs,
  setRawLYSubs,
  setRawHourly,
  setRawLWHourly,
  setRawLYHourly,
  setTop10,
  setInactiveSubDeptItems,
  setLedgerTab,
  setLedgerSelectedDate,
  setReportSevFilter,
  setSubDeptThreshold,
  setHourlyThreshold,
  setItemThreshold,
  openSheet,
  closeSheet,
  navigateToList,
} from "../../../features/salesLedgerSlice";
import type {
  SevFilter,
  GradingMetric,
} from "../../../features/salesLedgerSlice";
import SelectFilter from "../../../components/filters/SelectFilter";
import type { SubDeptMargin } from "../../../interfaces";
import type { Severity } from "../components/LedgerRow";
import {
  aggSubDepts,
  aggHours,
  aggByCode,
  deptSeverity,
  hourSeverity,
  fmtDate,
  ampm,
  formatPct,
  BADGE_BG,
  BADGE_COLOR,
  SEVERITY_RANK,
  computeDayMatchedTotals,
  // getWeeklyDataGaps,
  // getWeeklyGapCount,
  type DeptRow,
  type HourRow,
} from "../shared/ledgerUtils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import BottomSheet from "../../../components/BottomSheet";
import SevBadge from "./components/SevBadge";
import SevChips from "./components/SevChips";
// import DataGapReport from "./components/DataGapReport";

const LedgerStoreReport = () => {
  const dispatch = useAppDispatch();
  const sheetCloseRef = useRef<(() => void) | null>(null);
  const [itemSevFilter, setItemSevFilter] = useState<SevFilter>("all");
  const [itemActiveFilter, setItemActiveFilter] = useState("active");
  // const [gapReportOpen, setGapReportOpen] = useState(false);
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const {
    selection,
    tab,
    selectedDate,
    reportLoading,
    top10Loading,
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
    top10,
    inactiveSubDeptItems,
    reportSevFilter,
    openSheetType,
    openSheetId,
    subDeptThreshold,
    hourlyThreshold,
    itemThreshold,
    gradingMetric,
  } = useAppSelector((s) => s.salesLedger);

  const rawActiveThreshold =
    tab === "subdept" ? subDeptThreshold : hourlyThreshold;
  const [tabThresholdInput, setTabThresholdInput] = useState(
    rawActiveThreshold === null ? "" : String(rawActiveThreshold),
  );
  const [itemThresholdInput, setItemThresholdInput] = useState(
    itemThreshold === null ? "" : String(itemThreshold),
  );

  useEffect(() => {
    setTabThresholdInput(
      rawActiveThreshold === null ? "" : String(rawActiveThreshold),
    );
  }, [tab]);

  // Grading should never move rows around on its own when a threshold input
  // is cleared — keep grading against the last valid amount so severity/sort
  // order stays exactly where it was until a new number is typed.
  const subDeptThresholdRef = useRef<number>(subDeptThreshold ?? 9);
  if (subDeptThreshold != null) subDeptThresholdRef.current = subDeptThreshold;
  const effectiveSubDeptThreshold = subDeptThresholdRef.current;

  const hourlyThresholdRef = useRef<number>(hourlyThreshold ?? 9);
  if (hourlyThreshold != null) hourlyThresholdRef.current = hourlyThreshold;
  const effectiveHourlyThreshold = hourlyThresholdRef.current;

  const itemThresholdRef = useRef<number>(itemThreshold ?? 9);
  if (itemThreshold != null) itemThresholdRef.current = itemThreshold;
  const effectiveItemThreshold = itemThresholdRef.current;

  const activeThreshold =
    tab === "subdept" ? effectiveSubDeptThreshold : effectiveHourlyThreshold;

  // ── Date ranges ─────────────────────────────────────────────────────────────
  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
  const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
  // The full 7 calendar days of the searched week — deliberately NOT
  // selection.days (the store's weekly-sales row list), which only has an
  // entry for days that list actually returned a row for. A day missing
  // there doesn't mean this specific dept/hour/item has no real data for
  // it — using the true calendar range means every entity's LW/LY match is
  // scoped to its own genuine data, not gated by a different fetch's gaps.
  const twRealDates = Array.from(
    { length: 7 },
    (_, i) => addDays(new Date(twStart), i).toISOString().split("T")[0],
  );
  const lyWeekDates = twRealDates
    .map((d) => sameWeekDayLastYear(d).date)
    .sort();
  const lyStart = lyWeekDates[0];
  const lyEnd = lyWeekDates[lyWeekDates.length - 1];
  const lwWeekDates = twRealDates.map(
    (d) => addDays(new Date(d), -7).toISOString().split("T")[0],
  );
  // Dynamic date labels
  const twDateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(twStart)} – ${fmtDate(twEnd)}`;
  const lwDateLabel = selectedDate
    ? new Date(
        addDays(new Date(selectedDate), -7).toISOString().split("T")[0] +
          "T12:00:00",
      ).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}`;
  const lyDateLabel = selectedDate
    ? new Date(
        sameWeekDayLastYear(selectedDate).date + "T12:00:00",
      ).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(lyStart)} – ${fmtDate(lyEnd)}`;

  // ── Fetch report data on store selection ─────────────────────────────────────
  useEffect(() => {
    if (!selection) return;
    const run = async () => {
      dispatch(setReportLoading(true));
      dispatch(setRawSubs([]));
      dispatch(setRawLWSubs([]));
      dispatch(setRawLYSubs([]));
      dispatch(setRawHourly([]));
      dispatch(setRawLWHourly([]));
      dispatch(setRawLYHourly([]));
      try {
        const [s1, s2, s3, h1, h2, h3] = await Promise.all([
          getSubs(
            context.url,
            context.token,
            twStart,
            twEnd,
            0,
            selection.storeId,
            1,
          ),
          getSubs(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            0,
            selection.storeId,
            1,
          ),
          getSubs(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            twStart,
            twEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            0,
            selection.storeId,
            1,
          ),
        ]);
        if (s1.data.error === 0) dispatch(setRawSubs(s1.data.subs));
        if (s2.data.error === 0) dispatch(setRawLWSubs(s2.data.subs));
        if (s3.data.error === 0) dispatch(setRawLYSubs(s3.data.subs));
        if (h1.data.error === 0) dispatch(setRawHourly(h1.data.subs));
        if (h2.data.error === 0) dispatch(setRawLWHourly(h2.data.subs));
        if (h3.data.error === 0) dispatch(setRawLYHourly(h3.data.subs));
      } finally {
        dispatch(setReportLoading(false));
      }
    };
    run();
  }, [selection?.storeId]);

  // Reset item filter when a new sheet opens
  useEffect(() => {
    setItemSevFilter("all");
  }, [openSheetId]);

  // ── Fetch top 10 items ────────────────────────────────────────────────────────
  useEffect(() => {
    if (openSheetType !== "subdept" || openSheetId === null || !selection) {
      dispatch(setTop10([]));
      dispatch(setInactiveSubDeptItems([]));
      return;
    }
    const tyS = selectedDate ?? twStart;
    const tyE = selectedDate ?? twEnd;
    const lwDS = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwStart;
    const lwDE = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwEnd;
    const lyDS = selectedDate
      ? sameWeekDayLastYear(selectedDate).date
      : lyStart;
    const lyDE = selectedDate ? sameWeekDayLastYear(selectedDate).date : lyEnd;

    let cancelled = false;
    const run = async () => {
      dispatch(setTop10Loading(true));
      try {
        const [tyR, lwR, lyR] = await Promise.all([
          getSubMargins(
            context.url,
            context.token,
            openSheetId,
            tyS,
            tyE,
            0,
            selection.storeId,
            1,
          ),
          getSubMargins(
            context.url,
            context.token,
            openSheetId,
            lwDS,
            lwDE,
            0,
            selection.storeId,
            1,
          ),
          getSubMargins(
            context.url,
            context.token,
            openSheetId,
            lyDS,
            lyDE,
            0,
            selection.storeId,
            1,
          ),
        ]);
        if (cancelled) return;
        const tyItems: SubDeptMargin[] =
          tyR.data?.error === 0 ? tyR.data.subs : [];
        let lwItems: SubDeptMargin[] =
          lwR.data?.error === 0 ? lwR.data.subs : [];
        let lyItems: SubDeptMargin[] =
          lyR.data?.error === 0 ? lyR.data.subs : [];

        // Whole-week case: the fetched LW/LY rows can include days that
        // don't actually correspond to any day in this TW week — filter down
        // to the exact matched date set before aggregating, so item totals
        // agree with the dept-level and store-level figures shown elsewhere.
        if (!selectedDate) {
          const lwDateSet = new Set(lwWeekDates);
          const lyDateSet = new Set(lyWeekDates);
          lwItems = lwItems.filter((i) =>
            lwDateSet.has(i.sale_date.split("T")[0]),
          );
          lyItems = lyItems.filter((i) =>
            lyDateSet.has(i.sale_date.split("T")[0]),
          );
        }

        const tyMap = aggByCode(tyItems);
        const lwMap = aggByCode(lwItems);
        const lyMap = aggByCode(lyItems);
        const sorted = [...tyMap.entries()].sort((a, b) => b[1].qty - a[1].qty);
        dispatch(
          setTop10(
            sorted.map(([code, ty]) => {
              const lw = lwMap.get(code) ?? null;
              const ly = lyMap.get(code) ?? null;
              return {
                productCode: code,
                upc: code,
                desc: ty.desc,
                tyNet: ty.net,
                tyQty: ty.qty,
                tyWeight: ty.weight,
                lwNet: lw?.net ?? null,
                lwQty: lw?.qty ?? null,
                lwWeight: lw?.weight ?? null,
                lyNet: ly?.net ?? null,
                lyQty: ly?.qty ?? null,
                lyWeight: ly?.weight ?? null,
              };
            }),
          ),
        );
        // Items that sold LW and/or LY but have no TY row at all — invisible
        // in the normal TY-anchored list above since it's built from tyMap
        // alone. Surfaced separately so someone can spot "this used to sell
        // here" without it polluting the active list's severity counts.
        const inactiveCodes = new Set(
          [...lwMap.keys(), ...lyMap.keys()].filter((code) => !tyMap.has(code)),
        );
        const inactiveSorted = [...inactiveCodes].sort((a, b) => {
          const aTotal = (lwMap.get(a)?.net ?? 0) + (lyMap.get(a)?.net ?? 0);
          const bTotal = (lwMap.get(b)?.net ?? 0) + (lyMap.get(b)?.net ?? 0);
          return bTotal - aTotal;
        });
        dispatch(
          setInactiveSubDeptItems(
            inactiveSorted.map((code) => {
              const lw = lwMap.get(code) ?? null;
              const ly = lyMap.get(code) ?? null;
              return {
                productCode: code,
                upc: code,
                desc: lw?.desc ?? ly?.desc ?? code,
                tyNet: 0,
                tyQty: 0,
                tyWeight: 0,
                hasTY: false,
                lwNet: lw?.net ?? null,
                lwQty: lw?.qty ?? null,
                lwWeight: lw?.weight ?? null,
                lyNet: ly?.net ?? null,
                lyQty: ly?.qty ?? null,
                lyWeight: ly?.weight ?? null,
              };
            }),
          ),
        );
      } finally {
        if (!cancelled) dispatch(setTop10Loading(false));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [openSheetType, openSheetId, selectedDate]);

  // ── Computed rows ─────────────────────────────────────────────────────────────
  const depts = useMemo((): DeptRow[] => {
    const lwDay = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : null;
    const lyDay = selectedDate ? sameWeekDayLastYear(selectedDate).date : null;
    // Whole-week case: the raw LW/LY arrays can include days that don't
    // actually correspond to any day in this TW week (the LY range is
    // deliberately widened around holidays, and the underlying data itself
    // is fragmented) — filter down to the exact matched date set before
    // aggregating, so these figures agree with the KPI strip above them.
    const lwDateSet = new Set(lwWeekDates);
    const lyDateSet = new Set(lyWeekDates);
    const twSrc = selectedDate
      ? rawSubs.filter((s) => s.sale_date.startsWith(selectedDate))
      : rawSubs;
    const lwSrc = lwDay
      ? rawLWSubs.filter((s) => s.sale_date.startsWith(lwDay))
      : rawLWSubs.filter((s) => lwDateSet.has(s.sale_date.split("T")[0]));
    const lySrc = lyDay
      ? rawLYSubs.filter((s) => s.sale_date.startsWith(lyDay))
      : rawLYSubs.filter((s) => lyDateSet.has(s.sale_date.split("T")[0]));
    const twMap = aggSubDepts(twSrc);
    const lwMap = aggSubDepts(lwSrc);
    const lyMap = aggSubDepts(lySrc);
    return Object.entries(twMap)
      .map(([id, r]) => {
        const numId = Number(id);
        const lw = lwMap[numId];
        const ly = lyMap[numId];
        const lwNet = lw?.net ?? 0;
        const lyNet = ly?.net ?? 0;
        return {
          id: numId,
          desc: r.desc,
          tw: r.net,
          lw: lwNet,
          ly: lyNet,
          hasLW: lwNet > 0,
          hasLY: lyNet > 0,
          vsLWPct: lwNet ? ((r.net - lwNet) / lwNet) * 100 : 0,
          vsLYPct: lyNet ? ((r.net - lyNet) / lyNet) * 100 : 0,
          qty: r.qty,
          lwQty: lw?.qty ?? 0,
          lyQty: ly?.qty ?? 0,
          digital: r.digital,
          lyDigital: ly?.digital ?? 0,
          elecInstore: r.elecInstore,
          lyElecInstore: ly?.elecInstore ?? 0,
          elecStore: r.elecStore,
          lyElecStore: ly?.elecStore ?? 0,
          storeCpn: r.storeCpn,
          lyStoreCpn: ly?.storeCpn ?? 0,
        };
      })
      .sort((a, b) => {
        const rd =
          SEVERITY_RANK[deptSeverity(a, effectiveSubDeptThreshold)] -
          SEVERITY_RANK[deptSeverity(b, effectiveSubDeptThreshold)];
        return rd !== 0
          ? rd
          : (a.hasLY ? a.vsLYPct : a.vsLWPct) -
              (b.hasLY ? b.vsLYPct : b.vsLWPct);
      });
  }, [rawSubs, rawLWSubs, rawLYSubs, selectedDate, effectiveSubDeptThreshold]);

  const hours = useMemo((): HourRow[] => {
    const lwDay = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : null;
    const lyDay = selectedDate ? sameWeekDayLastYear(selectedDate).date : null;
    // Whole-week case: same day-matched filtering as `depts` above — the raw
    // LW/LY arrays can include days that don't correspond to any day in this
    // TW week.
    const lwDateSet = new Set(lwWeekDates);
    const lyDateSet = new Set(lyWeekDates);
    const twSrc = selectedDate
      ? rawHourly.filter((h) => h.sale_date.startsWith(selectedDate))
      : rawHourly;
    const lwSrc = lwDay
      ? rawLWHourly.filter((h) => h.sale_date.startsWith(lwDay))
      : rawLWHourly.filter((h) => lwDateSet.has(h.sale_date.split("T")[0]));
    const lySrc = lyDay
      ? rawLYHourly.filter((h) => h.sale_date.startsWith(lyDay))
      : rawLYHourly.filter((h) => lyDateSet.has(h.sale_date.split("T")[0]));
    const twMap = aggHours(twSrc);
    const lwMap = aggHours(lwSrc);
    const lyMap = aggHours(lySrc);
    return Array.from(new Set(Object.keys(twMap).map(Number)))
      .sort((a, b) => a - b)
      .map((h) => {
        const tw = twMap[h]?.net ?? 0;
        const lw = lwMap[h]?.net ?? 0;
        const ly = lyMap[h]?.net ?? 0;
        return {
          hour: h,
          tw,
          lw,
          ly,
          trans: twMap[h]?.trans ?? 0,
          lwTrans: lwMap[h]?.trans ?? 0,
          lyTrans: lyMap[h]?.trans ?? 0,
          qty: twMap[h]?.qty ?? 0,
          lwQty: lwMap[h]?.qty ?? 0,
          lyQty: lyMap[h]?.qty ?? 0,
          hasLW: lw > 0,
          hasLY: ly > 0,
          vsLWPct: lw ? ((tw - lw) / lw) * 100 : 0,
          vsLYPct: ly ? ((tw - ly) / ly) * 100 : 0,
        };
      })
      .sort((a, b) => {
        const rd =
          SEVERITY_RANK[hourSeverity(a, effectiveHourlyThreshold)] -
          SEVERITY_RANK[hourSeverity(b, effectiveHourlyThreshold)];
        return rd !== 0
          ? rd
          : (a.hasLY ? a.vsLYPct : a.vsLWPct) -
              (b.hasLY ? b.vsLYPct : b.vsLWPct);
      });
  }, [
    rawHourly,
    rawLWHourly,
    rawLYHourly,
    selectedDate,
    effectiveHourlyThreshold,
  ]);

  // ── Sheet row resolution ──────────────────────────────────────────────────────
  const sheetDept =
    openSheetType === "subdept"
      ? (depts.find((d) => d.id === openSheetId) ?? null)
      : null;
  const sheetHour =
    openSheetType === "hourly"
      ? (hours.find((h) => h.hour === openSheetId) ?? null)
      : null;
  const sheetRow = sheetDept ?? sheetHour;
  const sheetSev: Severity | null = sheetDept
    ? deptSeverity(sheetDept, effectiveSubDeptThreshold)
    : sheetHour
      ? hourSeverity(sheetHour, effectiveHourlyThreshold)
      : null;

  const sheetTW = sheetRow?.tw ?? 0;
  const sheetLW = sheetRow?.lw ?? 0;
  const sheetLY = sheetRow?.ly ?? 0;
  const sheetHasLW = sheetRow?.hasLW ?? false;
  const sheetHasLY = sheetRow?.hasLY ?? false;
  const sheetVsLW = sheetHasLW ? ((sheetTW - sheetLW) / sheetLW) * 100 : null;
  const sheetVsLY = sheetHasLY ? ((sheetTW - sheetLY) / sheetLY) * 100 : null;

  // ── KPI strip (dynamic on selectedDate) ──────────────────────────────────────
  const sortedDays = selection
    ? [...selection.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date))
    : [];
  const activeDay = selectedDate
    ? sortedDays.find((d) => d.sale_date.startsWith(selectedDate))
    : null;
  // Whole-week figures go through computeDayMatchedTotals so the KPI strip
  // agrees with the store list and day strip — the TW side of each
  // comparison is restricted to just the days with a genuine LW/LY match.
  const weekTotals = computeDayMatchedTotals(sortedDays);
  const kpiTW = activeDay ? activeDay.twNet : weekTotals.twTotal;
  const kpiLW = activeDay ? activeDay.lwNet : weekTotals.lwTotal;
  const kpiLY = activeDay ? activeDay.lyNet : weekTotals.lyTotal;
  const kpiHasLW = activeDay
    ? activeDay.lwNet !== null && activeDay.lwNet > 0
    : weekTotals.hasLW;
  const kpiHasLY = activeDay
    ? activeDay.lyNet !== null && activeDay.lyNet > 0
    : weekTotals.hasLY;
  const kpiVsLW = activeDay
    ? kpiHasLW
      ? ((activeDay.twNet - (activeDay.lwNet as number)) /
          (activeDay.lwNet as number)) *
        100
      : null
    : weekTotals.hasLW
      ? weekTotals.vsLWPct
      : null;
  const kpiVsLY = activeDay
    ? kpiHasLY
      ? ((activeDay.twNet - (activeDay.lyNet as number)) /
          (activeDay.lyNet as number)) *
        100
      : null
    : weekTotals.hasLY
      ? weekTotals.vsLYPct
      : null;

  // ── Signal items ──────────────────────────────────────────────────────────────
  const signalItems =
    tab === "subdept"
      ? depts.map((r) => ({
          sev: deptSeverity(r, effectiveSubDeptThreshold),
          label: r.desc,
          tw: r.tw,
          qty: r.qty,
          vsLYPct: r.vsLYPct,
          vsLWPct: r.vsLWPct,
          hasLY: r.hasLY,
          hasLW: r.hasLW,
          onClick: () => dispatch(openSheet({ type: "subdept", id: r.id })),
        }))
      : hours.map((r) => ({
          sev: hourSeverity(r, effectiveHourlyThreshold),
          label: `${ampm(r.hour)} – ${ampm(r.hour + 1 <= 23 ? r.hour + 1 : 0)}`,
          tw: r.tw,
          qty: r.qty,
          vsLYPct: r.vsLYPct,
          vsLWPct: r.vsLWPct,
          hasLY: r.hasLY,
          hasLW: r.hasLW,
          onClick: () => dispatch(openSheet({ type: "hourly", id: r.hour })),
        }));

  const filteredSignals =
    reportSevFilter === "all"
      ? signalItems
      : signalItems.filter((i) => i.sev === reportSevFilter);
  const reportCounts: Record<SevFilter, number> = {
    all: signalItems.length,
    critical: signalItems.filter((i) => i.sev === "critical").length,
    watch: signalItems.filter((i) => i.sev === "watch").length,
    healthy: signalItems.filter((i) => i.sev === "healthy").length,
  };

  const pillClass = (pct: number | null, t = activeThreshold) => {
    if (pct === null) return "bg-gray-100 text-gray-500";
    if (pct < -t) return "bg-red-100 text-red-800";
    if (pct < 0) return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  };

  // Checked against the raw weekly-sales fetch (not selection.days, which
  // only ever contains real TW rows) so a day missing from TW itself — not
  // just from LW/LY — actually shows up instead of being silently invisible.
  // const gaps = selection
  //   ? getWeeklyDataGaps(
  //       selection.storeId,
  //       twStart,
  //       twEnd,
  //       lwStart,
  //       lwEnd,
  //       weeklySales,
  //       weeklySalesLastWeek,
  //       weeklySalesLastYear,
  //     )
  //   : null;
  // const gapCount = gaps ? getWeeklyGapCount(gaps) : 0;

  if (!selection) return null;

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
        {/* Nav */}
        <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
          <button
            onClick={() => dispatch(navigateToList())}
            className="text-custom-white/85 mt-0.5 flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-custom-white font-semibold text-[13px]">
              {selection.storeName}
            </div>
            <div className="text-custom-white/85 text-[11px]">
              Weekly Sales Report
            </div>
          </div>
          {/* {gapCount > 0 && (
            <button
              onClick={() => setGapReportOpen(true)}
              title={`${gapCount} day${gapCount === 1 ? "" : "s"} missing comparison data`}
              className="relative flex items-center justify-center w-[20px] h-[20px] flex-shrink-0 mt-0.5"
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-custom-white opacity-50 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex items-center justify-center w-[16px] h-[16px] rounded-full bg-custom-white">
                <ExclamationTriangleIcon className="w-2.5 h-2.5 text-amber-600" />
              </span>
              <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] px-[3px] rounded-full bg-amber-600 text-custom-white text-[10px] font-semibold flex items-center justify-center leading-none">
                {gapCount}
              </span>
            </button>
          )} */}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-custom-white border-b border-gray-100 flex-shrink-0">
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              TY net sales
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {twDateLabel}
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5">
              {formatCurrency2(kpiTW)}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              vs last week
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {lwDateLabel}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kpiLW !== null ? formatCurrency2(kpiLW) : "—"}
              </span>
              {kpiVsLW !== null && (
                <span
                  className={`text-[10px] font-semibold ${kpiVsLW >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {formatPct(kpiVsLW)}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              vs last year
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {lyDateLabel}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kpiLY !== null ? formatCurrency2(kpiLY) : "—"}
              </span>
              {kpiVsLY !== null && (
                <span
                  className={`text-[10px] font-semibold ${kpiVsLY >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {formatPct(kpiVsLY)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Day strip */}
        <div className="grid grid-cols-8 bg-custom-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => dispatch(setLedgerSelectedDate(null))}
            className={`flex flex-col items-center justify-center py-2 border-r border-gray-100 transition-colors ${selectedDate === null ? "bg-[#1e2a4a]" : "hover:bg-gray-50"}`}
          >
            <span
              className={`text-[10px] font-bold ${selectedDate === null ? "text-custom-white" : "text-content"}`}
            >
              ALL
            </span>
            <span
              className={`text-[10px] mt-0.5 ${selectedDate === null ? "text-custom-white" : "text-content"}`}
            >
              wk
            </span>
          </button>
          {sortedDays.map((d) => {
            const dateStr = d.sale_date.split("T")[0];
            const date = new Date(dateStr + "T12:00:00");
            const isSelected = selectedDate === dateStr;
            const hasLY = d.lyNet !== null && d.lyNet > 0;
            const hasLW = d.lwNet !== null && d.lwNet > 0;
            const ref = hasLY
              ? (d.lyNet as number)
              : hasLW
                ? (d.lwNet as number)
                : 0;
            const hasRef = hasLY || hasLW;
            const refPct = hasRef ? ((d.twNet - ref) / ref) * 100 : 0;
            const isNeg = refPct < 0;
            // const dayBadgeBg = !hasRef
            //   ? "#e5e7eb"
            //   : isNeg
            //     ? "#fee2e2"
            //     : "#d1fae5";
            const dayBadgeColor = !hasRef
              ? "#9ca3af"
              : isNeg
                ? "#ef4444"
                : "#10b981";
            return (
              <button
                key={dateStr}
                onClick={() =>
                  dispatch(setLedgerSelectedDate(isSelected ? null : dateStr))
                }
                className={`flex flex-col items-center justify-center gap-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors ${isSelected ? "bg-[#1e2a4a]" : "hover:bg-gray-50"}`}
              >
                <span
                  className={`text-[10px] font-semibold leading-none ${isSelected ? "text-custom-white" : "text-content"}`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  <span
                    className={
                      isSelected ? "text-custom-white" : "text-content"
                    }
                  >
                    {date.toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  {!hasRef ? (
                    <span className="text-[10px] font-bold">—</span>
                  ) : isNeg ? (
                    <ExclamationTriangleIcon
                      className="w-5 h-5"
                      style={{ color: dayBadgeColor }}
                    />
                  ) : (
                    <CheckCircleIcon
                      className="w-5 h-5"
                      style={{ color: dayBadgeColor }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tabs + threshold */}
        <div className="flex items-center bg-custom-white border-b border-gray-100 flex-shrink-0 px-3">
          {(["subdept", "hourly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                dispatch(setLedgerTab(t));
                dispatch(closeSheet());
              }}
              className={`py-2.5 px-3 text-[13px] font-medium border-b-2 transition-colors ${tab === t ? "border-[#1e2a4a] text-content" : "border-transparent text-content/85"}`}
            >
              {t === "subdept" ? "Sub dept" : "Hourly"}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-content/85">Threshold</span>
            <input
              type="number"
              min={1}
              max={99}
              value={tabThresholdInput}
              onChange={(e) => {
                setTabThresholdInput(e.target.value);
                if (e.target.value === "") {
                  dispatch(
                    tab === "subdept"
                      ? setSubDeptThreshold(null)
                      : setHourlyThreshold(null),
                  );
                  return;
                }
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 99)
                  dispatch(
                    tab === "subdept"
                      ? setSubDeptThreshold(v)
                      : setHourlyThreshold(v),
                  );
              }}
              onBlur={() => {
                const v = parseInt(tabThresholdInput, 10);
                if (tabThresholdInput !== "" && (isNaN(v) || v < 1 || v > 99))
                  setTabThresholdInput(
                    rawActiveThreshold === null
                      ? ""
                      : String(rawActiveThreshold),
                  );
              }}
              className="w-9 text-center text-[11px] bg-gray-50 border border-gray-200 rounded px-1 py-px focus:outline-none focus:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-content/85">%</span>
          </div>
        </div>

        {/* Signal filter chips */}
        <SevChips
          active={reportSevFilter}
          counts={reportCounts}
          onChange={(f) => dispatch(setReportSevFilter(f))}
        />

        {/* Signal list */}
        <div className="flex-1 overflow-y-auto">
          {reportLoading ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
              Loading…
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
              No data
            </div>
          ) : (
            filteredSignals.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="w-full px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <SevBadge sev={item.sev} />
                  <span className="flex-1 text-[12px] font-medium text-content truncate">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-2 flex-shrink-0">
                    <span className="text-[12px] font-semibold text-content">
                      {formatCurrency2(item.tw)}
                    </span>
                    <span className="text-[11px] text-content/85">
                      {item.qty.toLocaleString()} u
                    </span>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
                </div>
                <div className="flex gap-2 mt-1.5 justify-end">
                  {item.hasLW && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pillClass(item.vsLWPct)}`}
                    >
                      LW {formatPct(item.vsLWPct)}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pillClass(item.hasLY ? item.vsLYPct : null)}`}
                  >
                    LY {item.hasLY ? formatPct(item.vsLYPct) : "—"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      {openSheetType && sheetRow && sheetSev && (
        <BottomSheet
          onClose={() => dispatch(closeSheet())}
          closeRef={sheetCloseRef}
        >
          {/* Sheet header */}
          <div className="flex items-start justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
            <div>
              <div className="text-[14px] font-semibold text-content">
                {openSheetType === "subdept" && sheetDept
                  ? sheetDept.desc
                  : openSheetType === "hourly" && sheetHour
                    ? ampm(sheetHour.hour)
                    : ""}
              </div>
              <div className="text-[10px] text-content/85 mt-0.5">
                {twDateLabel}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: BADGE_BG[sheetSev],
                  color: BADGE_COLOR[sheetSev],
                }}
              >
                {sheetSev === "critical" && (
                  <ExclamationTriangleIcon className="w-3 h-3" />
                )}
                {sheetSev === "watch" && (
                  <ExclamationCircleIcon className="w-3 h-3" />
                )}
                {sheetSev === "healthy" && (
                  <CheckCircleIcon className="w-3 h-3" />
                )}
                {sheetSev.charAt(0).toUpperCase() + sheetSev.slice(1)}
              </div>
            </div>
          </div>

          {/* Scrollable metrics */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* 3-col KPI strip: TY / LW / LY — units below $ in each col */}
            {(() => {
              const tyQty = sheetRow.qty;
              const lwQty = sheetDept
                ? sheetDept.lwQty
                : sheetHour
                  ? sheetHour.lwQty
                  : 0;
              const lyQty = sheetDept
                ? sheetDept.lyQty
                : sheetHour
                  ? sheetHour.lyQty
                  : 0;
              return (
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="px-3 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                        TY
                      </span>
                      <span className="text-[10px] text-content/85">
                        {twDateLabel}
                      </span>
                    </div>
                    <div className="text-[12px] font-semibold text-content mt-0.5">
                      {formatCurrency2(sheetTW)}
                    </div>
                    <div className="text-[10px] text-content/85 mt-0.5">
                      {tyQty.toLocaleString()} u
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                        LW
                      </span>
                      <span className="text-[10px] text-content/85">
                        {lwDateLabel}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-[12px] font-semibold text-content">
                        {sheetHasLW ? formatCurrency2(sheetLW) : "—"}
                      </span>
                      {sheetVsLW !== null && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pillClass(sheetVsLW)}`}
                        >
                          {formatPct(sheetVsLW)}
                        </span>
                      )}
                    </div>
                    {lwQty > 0 && (
                      <div className="text-[10px] text-content/85 mt-0.5">
                        {lwQty.toLocaleString()} u
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                        LY
                      </span>
                      <span className="text-[10px] text-content/85">
                        {lyDateLabel}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-[12px] font-semibold text-content">
                        {sheetHasLY ? formatCurrency2(sheetLY) : "—"}
                      </span>
                      {sheetVsLY !== null && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pillClass(sheetVsLY)}`}
                        >
                          {formatPct(sheetVsLY)}
                        </span>
                      )}
                    </div>
                    {lyQty > 0 && (
                      <div className="text-[10px] text-content/85 mt-0.5">
                        {lyQty.toLocaleString()} u
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {openSheetType === "hourly" && sheetHour && (
              <>
                {/* Transactions — TY + LW pill + LY pill */}
                {(() => {
                  const lwTransPct =
                    sheetHour.lwTrans > 0
                      ? ((sheetHour.trans - sheetHour.lwTrans) /
                          sheetHour.lwTrans) *
                        100
                      : null;
                  const lyTransPct =
                    sheetHour.lyTrans > 0
                      ? ((sheetHour.trans - sheetHour.lyTrans) /
                          sheetHour.lyTrans) *
                        100
                      : null;
                  return (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-content/90">
                          Transactions
                        </span>
                        <span className="text-[13px] font-semibold text-content">
                          {sheetHour.trans.toLocaleString()}
                        </span>
                      </div>
                      {(lwTransPct !== null || lyTransPct !== null) && (
                        <div className="flex items-center gap-2 mt-1.5 justify-end">
                          {lwTransPct !== null && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pillClass(lwTransPct)}`}
                            >
                              LW {sheetHour.lwTrans.toLocaleString()}{" "}
                              {formatPct(lwTransPct)}
                            </span>
                          )}
                          {lyTransPct !== null && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pillClass(lyTransPct)}`}
                            >
                              LY {sheetHour.lyTrans.toLocaleString()}{" "}
                              {formatPct(lyTransPct)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {sheetHour.trans > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-[12px] text-content/90">
                      Avg basket
                    </span>
                    <span className="text-[13px] font-medium text-content">
                      {formatCurrency2(sheetTW / sheetHour.trans)}
                    </span>
                  </div>
                )}
              </>
            )}
            {openSheetType === "subdept" &&
              (() => {
                const itemSeverity = (
                  item: (typeof top10)[0],
                  metric: GradingMetric,
                ): Severity => {
                  // Grades on the same metric (Sales vs Qty, per the
                  // gradingMetric toggle) the pill below actually displays —
                  // grading on a different metric than what's shown would
                  // let the badge disagree with a visible 0% figure.
                  const lyPct =
                    metric === "sales"
                      ? item.lyNet !== null && item.lyNet > 0
                        ? ((item.tyNet - item.lyNet) / item.lyNet) * 100
                        : null
                      : item.lyQty !== null && item.lyQty > 0
                        ? ((item.tyQty - item.lyQty) / item.lyQty) * 100
                        : null;
                  const lwPct =
                    metric === "sales"
                      ? item.lwNet !== null && item.lwNet > 0
                        ? ((item.tyNet - item.lwNet) / item.lwNet) * 100
                        : null
                      : item.lwQty !== null && item.lwQty > 0
                        ? ((item.tyQty - item.lwQty) / item.lwQty) * 100
                        : null;
                  // Rounded before grading — tyNet/lwNet/lyNet (and their qty
                  // counterparts) are sums of individual line items, so
                  // floating-point noise can leave a value like
                  // -0.0000000001% even when the displayed figures are
                  // identical, misgrading it "watch".
                  const pct = Math.round((lyPct ?? lwPct ?? 0) * 10) / 10;
                  if (pct < -effectiveItemThreshold) return "critical";
                  if (pct < 0) return "watch";
                  return "healthy";
                };
                const baseItems =
                  itemActiveFilter === "inactive"
                    ? inactiveSubDeptItems
                    : itemActiveFilter === "active"
                      ? top10
                      : [...top10, ...inactiveSubDeptItems];
                const itemsWithSev = baseItems.map((item) => ({
                  ...item,
                  sev: itemSeverity(item, gradingMetric),
                }));
                const itemCounts: Record<SevFilter, number> = {
                  all: itemsWithSev.length,
                  critical: itemsWithSev.filter((i) => i.sev === "critical")
                    .length,
                  watch: itemsWithSev.filter((i) => i.sev === "watch").length,
                  healthy: itemsWithSev.filter((i) => i.sev === "healthy")
                    .length,
                };
                const filteredItems =
                  itemSevFilter === "all"
                    ? itemsWithSev
                    : itemsWithSev.filter((i) => i.sev === itemSevFilter);

                return (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-100 border-t border-t-gray-100">
                      <SelectFilter
                        options={[
                          { label: "Active", value: "active" },
                          {
                            label: `Inactive (${inactiveSubDeptItems.length})`,
                            value: "inactive",
                          },
                        ]}
                        value={itemActiveFilter}
                        onChange={setItemActiveFilter}
                        placeholder="All items"
                        className="w-[110px]"
                      />
                      <div className="flex-1" />
                      <span className="text-[10px] text-content/85">
                        Threshold
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={itemThresholdInput}
                        onChange={(e) => {
                          setItemThresholdInput(e.target.value);
                          if (e.target.value === "") {
                            dispatch(setItemThreshold(null));
                            return;
                          }
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1 && v <= 99)
                            dispatch(setItemThreshold(v));
                        }}
                        onBlur={() => {
                          const v = parseInt(itemThresholdInput, 10);
                          if (
                            itemThresholdInput !== "" &&
                            (isNaN(v) || v < 1 || v > 99)
                          )
                            setItemThresholdInput(
                              itemThreshold === null
                                ? ""
                                : String(itemThreshold),
                            );
                        }}
                        className="w-9 text-center text-[10px] bg-custom-white border border-gray-200 rounded px-1 py-px focus:outline-none focus:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-content/85">%</span>
                    </div>
                    {/* Item filter chips — sticky so items scroll beneath */}
                    <div className="flex gap-2 px-4 py-2 bg-custom-white border-b border-gray-100 sticky top-0 z-10">
                      {(
                        ["all", "critical", "watch", "healthy"] as SevFilter[]
                      ).map((f) => {
                        const label =
                          f === "all"
                            ? `All (${itemCounts.all})`
                            : f === "critical"
                              ? `Crit (${itemCounts.critical})`
                              : f === "watch"
                                ? `Watch (${itemCounts.watch})`
                                : `OK (${itemCounts.healthy})`;
                        const active = itemSevFilter === f;
                        const colorClass = active
                          ? f === "all"
                            ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
                            : f === "critical"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : f === "watch"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-custom-white text-content/85 border-gray-200";
                        return (
                          <button
                            key={f}
                            onClick={() => setItemSevFilter(f)}
                            className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${colorClass}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {top10Loading ? (
                      <div className="px-4 py-3 text-[11px] text-content/85">
                        Loading…
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="px-4 py-3 text-[11px] text-content/85">
                        No data
                      </div>
                    ) : (
                      (["critical", "watch", "healthy"] as Severity[]).map(
                        (sev) => {
                          const group = filteredItems.filter(
                            (i) => i.sev === sev,
                          );
                          if (!group.length) return null;
                          return (
                            <div key={sev}>
                              {group.map((item) => {
                                const lwNetPct =
                                  gradingMetric === "sales"
                                    ? item.lwNet !== null && item.lwNet > 0
                                      ? ((item.tyNet - item.lwNet) /
                                          item.lwNet) *
                                        100
                                      : null
                                    : item.lwQty !== null && item.lwQty > 0
                                      ? ((item.tyQty - item.lwQty) /
                                          item.lwQty) *
                                        100
                                      : null;
                                const lyNetPct =
                                  gradingMetric === "sales"
                                    ? item.lyNet !== null && item.lyNet > 0
                                      ? ((item.tyNet - item.lyNet) /
                                          item.lyNet) *
                                        100
                                      : null
                                    : item.lyQty !== null && item.lyQty > 0
                                      ? ((item.tyQty - item.lyQty) /
                                          item.lyQty) *
                                        100
                                      : null;
                                return (
                                  <div
                                    key={item.productCode}
                                    className="px-4 py-2.5 border-b border-gray-100"
                                  >
                                    <div className="flex items-start gap-2">
                                      <SevBadge sev={item.sev} />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                          <span
                                            className="text-[12px] font-medium text-content truncate"
                                            style={{ maxWidth: "55%" }}
                                          >
                                            {item.desc}
                                          </span>
                                          <span className="text-[10px] text-content/85 flex-shrink-0">
                                            {item.upc}
                                          </span>
                                        </div>
                                        {/* TW / LW / LY: net sales + qty + weight per period */}
                                        <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded mt-1.5">
                                          <div className="px-2 py-1.5">
                                            <div className="text-[10px] text-content/85 uppercase tracking-wide">
                                              TW
                                            </div>
                                            <div className="text-[10px] font-semibold text-content mt-0.5">
                                              {item.hasTY === false
                                                ? "—"
                                                : formatCurrency2(item.tyNet)}
                                            </div>
                                            <div className="text-[10px] text-content/85 mt-0.5">
                                              {item.hasTY === false
                                                ? ""
                                                : `${item.tyQty.toLocaleString()} u`}
                                            </div>
                                            {item.hasTY !== false &&
                                              item.tyWeight > 0 && (
                                                <div className="text-[10px] text-content/85 mt-0.5">
                                                  {item.tyWeight.toFixed(2)} lb
                                                </div>
                                              )}
                                          </div>
                                          <div className="px-2 py-1.5">
                                            <div className="text-[10px] text-content/85 uppercase tracking-wide">
                                              LW
                                            </div>
                                            <div className="flex items-baseline gap-1 mt-0.5">
                                              <span className="text-[10px] font-semibold text-content">
                                                {item.lwNet !== null
                                                  ? formatCurrency2(item.lwNet)
                                                  : "—"}
                                              </span>
                                              {lwNetPct !== null && (
                                                <span
                                                  className={`text-[10px] font-semibold px-1 py-0.5 rounded ${pillClass(lwNetPct, effectiveItemThreshold)}`}
                                                >
                                                  {formatPct(lwNetPct)}
                                                </span>
                                              )}
                                            </div>
                                            {item.lwQty !== null && (
                                              <div className="text-[10px] text-content/85 mt-0.5">
                                                {item.lwQty.toLocaleString()} u
                                              </div>
                                            )}
                                            {item.lwWeight !== null &&
                                              item.lwWeight > 0 && (
                                                <div className="text-[10px] text-content/85 mt-0.5">
                                                  {item.lwWeight.toFixed(2)} lb
                                                </div>
                                              )}
                                          </div>
                                          <div className="px-2 py-1.5">
                                            <div className="text-[10px] text-content/85 uppercase tracking-wide">
                                              LY
                                            </div>
                                            <div className="flex items-baseline gap-1 mt-0.5">
                                              <span className="text-[10px] font-semibold text-content">
                                                {item.lyNet !== null
                                                  ? formatCurrency2(item.lyNet)
                                                  : "—"}
                                              </span>
                                              {lyNetPct !== null && (
                                                <span
                                                  className={`text-[10px] font-semibold px-1 py-0.5 rounded ${pillClass(lyNetPct, effectiveItemThreshold)}`}
                                                >
                                                  {formatPct(lyNetPct)}
                                                </span>
                                              )}
                                            </div>
                                            {item.lyQty !== null && (
                                              <div className="text-[10px] text-content/85 mt-0.5">
                                                {item.lyQty.toLocaleString()} u
                                              </div>
                                            )}
                                            {item.lyWeight !== null &&
                                              item.lyWeight > 0 && (
                                                <div className="text-[10px] text-content/85 mt-0.5">
                                                  {item.lyWeight.toFixed(2)} lb
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        },
                      )
                    )}
                  </>
                );
              })()}
          </div>
        </BottomSheet>
      )}

      {/* {gapReportOpen && selection && gaps && (
        <DataGapReport
          gaps={gaps}
          storeName={selection.storeName}
          storeNumber={selection.storeNumber}
          onClose={() => setGapReportOpen(false)}
        />
      )} */}
    </>
  );
};

export default LedgerStoreReport;
