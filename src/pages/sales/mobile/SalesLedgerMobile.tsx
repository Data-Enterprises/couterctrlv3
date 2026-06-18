import { useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import StorePicker from "../../../components/storePicker/StorePicker";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import { getWeekly, getSubs, getHourly } from "../../../api/sales";
import { getSubMargins } from "../../../api/subMargins";
import { addDays, formatGoliathDate, sameWeekDayLastYear, formatCurrency2 } from "../../../utils";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
  reQuery,
} from "../../../features/salesSlice";
import {
  setHasSearched,
  setLedgerLoading,
  setReportLoading,
  setTop10Loading,
  setRawSubs,
  setRawLWSubs,
  setRawLYSubs,
  setRawHourly,
  setRawLWHourly,
  setRawLYHourly,
  setTop10,
  setLedgerTab,
  setLedgerSelectedDate,
  setListSevFilter,
  setReportSevFilter,
  openSheet,
  closeSheet,
  navigateToReport,
  navigateToList,
  type SevFilter,
  type Top10Item,
} from "../../../features/salesLedgerSlice";
import type { WeeklySale, SubSale, HourlySale, SubDeptMargin } from "../../../interfaces";
import type { LedgerRowData, Severity, StoreSelection } from "../components/LedgerRow";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeptRow = {
  id: number; desc: string;
  tw: number; lw: number; ly: number;
  hasLW: boolean; hasLY: boolean;
  vsLWPct: number; vsLYPct: number;
  qty: number; lyQty: number;
  digital: number; lyDigital: number;
  elecInstore: number; lyElecInstore: number;
  elecStore: number; lyElecStore: number;
  storeCpn: number; lyStoreCpn: number;
};

type HourRow = {
  hour: number;
  tw: number; lw: number; ly: number;
  trans: number; lwTrans: number; lyTrans: number;
  qty: number; lwQty: number; lyQty: number;
  vsLWPct: number; vsLYPct: number;
  hasLW: boolean; hasLY: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const THRESHOLD = 9;
const SEVERITY_RANK = { critical: 0, watch: 1, healthy: 2 } as const;
const BADGE_BG: Record<Severity, string> = { critical: "#fee2e2", watch: "#fef3c7", healthy: "#d1fae5" };
const BADGE_COLOR: Record<Severity, string> = { critical: "#ef4444", watch: "#f59e0b", healthy: "#10b981" };
const SECTION_BG: Record<Severity, string> = { critical: "bg-red-50", watch: "bg-amber-50", healthy: "bg-emerald-50" };
const SECTION_BORDER: Record<Severity, string> = { critical: "border-red-100", watch: "border-amber-100", healthy: "border-emerald-100" };
const SECTION_TEXT: Record<Severity, string> = { critical: "text-red-800", watch: "text-amber-800", healthy: "text-emerald-800" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

const deptSeverity = (r: DeptRow): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -THRESHOLD) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const hourSeverity = (r: HourRow): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -THRESHOLD) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const buildLedgerRows = (tw: WeeklySale[], lw: WeeklySale[], ly: WeeklySale[]): LedgerRowData[] => {
  const storeIds = [...new Set(tw.map((d) => d.storeid))];
  return storeIds
    .map((id) => {
      const twRows = tw.filter((d) => d.storeid === id);
      const lwRows = lw.filter((d) => d.storeid === id);
      const lyRows = ly.filter((d) => d.storeid === id);
      const ref = twRows[0];
      const twTotal = twRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const lwTotal = lwRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const lyTotal = lyRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const hasLW = lwTotal > 0;
      const hasLY = lyTotal > 0;
      const vsLYDollar = twTotal - lyTotal;
      const vsLYPct = hasLY ? (vsLYDollar / lyTotal) * 100 : 0;
      const vsLWPct = hasLW ? ((twTotal - lwTotal) / lwTotal) * 100 : 0;
      const severity: LedgerRowData["severity"] = (() => {
        const pct = hasLY ? vsLYPct : hasLW ? vsLWPct : 0;
        if (pct < -THRESHOLD) return "critical";
        if (pct < 0) return "watch";
        return "healthy";
      })();
      const days = twRows
        .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
        .map((r) => {
          const twDate = r.sale_date.split("T")[0];
          const lwDate = addDays(new Date(twDate), -7).toISOString().split("T")[0];
          const lyDate = sameWeekDayLastYear(twDate).date;
          const lwRow = lwRows.find((l) => l.sale_date.startsWith(lwDate));
          const lyRow = lyRows.find((l) => l.sale_date.startsWith(lyDate));
          return {
            sale_date: r.sale_date,
            twNet: r.total_sales - r.total_tax,
            lwNet: lwRow ? lwRow.total_sales - lwRow.total_tax : 0,
            lyNet: lyRow ? lyRow.total_sales - lyRow.total_tax : 0,
          };
        });
      return {
        storeid: id, store_name: ref.store_name, store_number: ref.store_number,
        twTotal, lwTotal, lyTotal, vsLWPct, vsLYPct, vsLYDollar, hasLW, hasLY, severity, days,
      };
    })
    .sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
      const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
      return aPct - bPct;
    });
};

const aggSubDepts = (src: SubSale[]) =>
  src.reduce(
    (acc: Record<number, { desc: string; net: number; qty: number; digital: number; elecInstore: number; elecStore: number; storeCpn: number }>, s) => {
      if (!acc[s.sub_department])
        acc[s.sub_department] = { desc: s.sub_department_description, net: 0, qty: 0, digital: 0, elecInstore: 0, elecStore: 0, storeCpn: 0 };
      acc[s.sub_department].net += s.total_sales - s.total_tax;
      acc[s.sub_department].qty += s.qty;
      acc[s.sub_department].digital += s.digital_coupons;
      acc[s.sub_department].elecInstore += s.elec_instore_coupons;
      acc[s.sub_department].elecStore += s.elec_store_coupons;
      acc[s.sub_department].storeCpn += s.store_coupon;
      return acc;
    },
    {},
  );

const aggHours = (src: HourlySale[]) =>
  src.reduce(
    (acc: Record<number, { net: number; trans: number; qty: number }>, h) => {
      if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
      acc[h.hour].net += h.total_sales - h.total_tax;
      acc[h.hour].trans += h.transactions;
      acc[h.hour].qty += h.qty;
      return acc;
    },
    {},
  );

const aggByCode = (items: SubDeptMargin[]): Map<string, { desc: string; net: number; qty: number }> => {
  const map = new Map<string, { desc: string; net: number; qty: number }>();
  for (const item of items) {
    const ex = map.get(item.product_code);
    if (ex) { ex.net += item.total_sales - item.total_tax; ex.qty += item.qty; }
    else map.set(item.product_code, { desc: item.product_description, net: item.total_sales - item.total_tax, qty: item.qty });
  }
  return map;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SevBadge = ({ sev }: { sev: Severity }) => (
  <div
    className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0"
    style={{ background: BADGE_BG[sev] }}
  >
    {sev === "critical" && <ExclamationTriangleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sev] }} />}
    {sev === "watch" && <ExclamationCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sev] }} />}
    {sev === "healthy" && <CheckCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[sev] }} />}
  </div>
);

const SectionHeader = ({ sev, count }: { sev: Severity; count: number }) => (
  <div className={`flex items-center gap-2 px-3 py-2 border-b ${SECTION_BORDER[sev]} ${SECTION_BG[sev]}`}>
    <SevBadge sev={sev} />
    <span className={`text-[11px] font-semibold flex-1 ${SECTION_TEXT[sev]}`}>
      {sev.charAt(0).toUpperCase() + sev.slice(1)}
    </span>
    <span className={`text-[10px] ${SECTION_TEXT[sev]} opacity-60`}>{count}</span>
  </div>
);

const StoreRow = ({ row, onClick }: { row: LedgerRowData; onClick: (row: LedgerRowData) => void }) => {
  const sortedDays = [...row.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
  return (
    <button
      onClick={() => onClick(row)}
      className="flex items-center w-full px-3 py-3 gap-3 bg-white border-b border-gray-100 last:border-0 text-left active:bg-gray-50"
    >
      <SevBadge sev={row.severity} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-content/65 leading-none mb-0.5">{row.store_number}</div>
        <div className="text-[12px] font-medium text-content truncate mb-1.5">{row.store_name}</div>
        <div className="flex gap-0.5">
          {sortedDays.map((d) => {
            const dateStr = d.sale_date.split("T")[0];
            const dayLabel = new Date(dateStr + "T12:00:00")
              .toLocaleDateString("en-US", { weekday: "short" })
              .slice(0, 1);
            const hasLY = d.lyNet > 0;
            const hasLW = d.lwNet > 0;
            const ref = hasLY ? d.lyNet : hasLW ? d.lwNet : 0;
            const hasRef = hasLY || hasLW;
            const isPos = hasRef ? d.twNet >= ref : true;
            return (
              <div
                key={d.sale_date}
                className={`w-6 h-[18px] rounded text-[8px] font-bold flex items-center justify-center ${
                  !hasRef ? "bg-gray-200 text-gray-400" : isPos ? "bg-emerald-400 text-white" : "bg-red-400 text-white"
                }`}
              >
                {dayLabel}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className={`text-[11px] font-medium ${row.hasLY ? (row.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500") : "text-content/55"}`}>
          LY {row.hasLY ? formatPct(row.vsLYPct) : "—"}
        </span>
        {row.hasLW && (
          <span className={`text-[11px] font-medium ${row.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            LW {formatPct(row.vsLWPct)}
          </span>
        )}
      </div>
      <ChevronRightIcon className="w-4 h-4 text-content/40 flex-shrink-0" />
    </button>
  );
};

const SevChips = ({
  active,
  counts,
  onChange,
}: {
  active: SevFilter;
  counts: Record<SevFilter, number>;
  onChange: (f: SevFilter) => void;
}) => (
  <div className="flex gap-2 px-3 py-2 bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
    {(["all", "critical", "watch", "healthy"] as SevFilter[]).map((f) => {
      const isActive = active === f;
      const cls: Record<SevFilter, string> = {
        all: isActive ? "bg-[#1e2a4a] text-white border-[#1e2a4a]" : "bg-white text-content/75 border-gray-200",
        critical: isActive ? "bg-red-600 text-white border-red-600" : "bg-white text-red-700 border-red-200",
        watch: isActive ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-800 border-amber-200",
        healthy: isActive ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-800 border-emerald-200",
      };
      const label = f === "all" ? `All (${counts.all})` : f === "critical" ? `Crit (${counts.critical})` : f === "watch" ? `Watch (${counts.watch})` : `OK (${counts.healthy})`;
      return (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`flex-shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${cls[f]}`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SalesLedgerMobile = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const { weeklySales, weeklySalesLastWeek, weeklySalesLastYear } = useAppSelector((s) => s.sales);
  const {
    hasSearched, selection, tab, selectedDate,
    ledgerLoading, reportLoading, top10Loading,
    rawSubs, rawLWSubs, rawLYSubs,
    rawHourly, rawLWHourly, rawLYHourly,
    top10,
    screen, listSevFilter, reportSevFilter,
    openSheetType, openSheetId,
  } = useAppSelector((s) => s.salesLedger);

  // ── Always lock body scroll ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Date ranges ─────────────────────────────────────────────────────────────
  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
  const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
  const lyEnd = sameWeekDayLastYear(twEnd).date;
  const lyStart = sameWeekDayLastYear(twStart).date;

  const weekLabel = `${fmtDate(twStart)} – ${fmtDate(twEnd)}, ${new Date(twEnd + "T12:00:00").getFullYear()}`;

  // Dynamic date labels based on selectedDate
  const twDateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : `${fmtDate(twStart)} – ${fmtDate(twEnd)}`;
  const lwDateLabel = selectedDate
    ? new Date(addDays(new Date(selectedDate), -7).toISOString().split("T")[0] + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}`;
  const lyDateLabel = selectedDate
    ? new Date(sameWeekDayLastYear(selectedDate).date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : `${fmtDate(lyStart)} – ${fmtDate(lyEnd)}`;

  // ── Fetch weekly (store list) ────────────────────────────────────────────────
  const fetchLedger = async () => {
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;
    if (!searchValue) return;
    dispatch(setHasSearched(true));
    dispatch(setLedgerLoading(true));
    dispatch(reQuery());
    try {
      const [twResp, lwResp, lyResp] = await Promise.all([
        getWeekly(context.url, context.token, twStart, twEnd, useGroups, searchValue, singleStore),
        getWeekly(context.url, context.token, lwStart, lwEnd, useGroups, searchValue, singleStore),
        getWeekly(context.url, context.token, lyStart, lyEnd, useGroups, searchValue, singleStore),
      ]);
      if (twResp.data.error === 0) dispatch(setWeeklySales(twResp.data.sales));
      if (lwResp.data.error === 0) dispatch(setWeeklySalesLastWeek(lwResp.data.sales));
      if (lyResp.data.error === 0) dispatch(setWeeklySalesLastYear(lyResp.data.sales));
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  // ── Fetch store report on store selection ────────────────────────────────────
  useEffect(() => {
    if (!selection) return;
    const run = async () => {
      dispatch(setReportLoading(true));
      dispatch(setRawSubs([])); dispatch(setRawLWSubs([])); dispatch(setRawLYSubs([]));
      dispatch(setRawHourly([])); dispatch(setRawLWHourly([])); dispatch(setRawLYHourly([]));
      try {
        const [s1, s2, s3, h1, h2, h3] = await Promise.all([
          getSubs(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
          getSubs(context.url, context.token, lwStart, lwEnd, 0, selection.storeId, 1),
          getSubs(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
          getHourly(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
          getHourly(context.url, context.token, lwStart, lwEnd, 0, selection.storeId, 1),
          getHourly(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
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

  // ── Fetch top 10 items when dept sheet opens ─────────────────────────────────
  useEffect(() => {
    if (openSheetType !== "subdept" || openSheetId === null || !selection) {
      dispatch(setTop10([]));
      return;
    }
    const tyS = selectedDate ?? twStart;
    const tyE = selectedDate ?? twEnd;
    const lwDS = selectedDate ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0] : lwStart;
    const lwDE = selectedDate ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0] : lwEnd;
    const lyDS = selectedDate ? sameWeekDayLastYear(selectedDate).date : lyStart;
    const lyDE = selectedDate ? sameWeekDayLastYear(selectedDate).date : lyEnd;

    let cancelled = false;
    const run = async () => {
      dispatch(setTop10Loading(true));
      try {
        const [tyR, lwR, lyR] = await Promise.all([
          getSubMargins(context.url, context.token, openSheetId, tyS, tyE, 0, selection.storeId, 1),
          getSubMargins(context.url, context.token, openSheetId, lwDS, lwDE, 0, selection.storeId, 1),
          getSubMargins(context.url, context.token, openSheetId, lyDS, lyDE, 0, selection.storeId, 1),
        ]);
        if (cancelled) return;
        const tyItems: SubDeptMargin[] = tyR.data?.error === 0 ? tyR.data.subs : [];
        const lwItems: SubDeptMargin[] = lwR.data?.error === 0 ? lwR.data.subs : [];
        const lyItems: SubDeptMargin[] = lyR.data?.error === 0 ? lyR.data.subs : [];
        const tyMap = aggByCode(tyItems);
        const lwMap = aggByCode(lwItems);
        const lyMap = aggByCode(lyItems);
        const sorted = [...tyMap.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
        dispatch(setTop10(sorted.map(([code, ty]) => {
          const lw = lwMap.get(code) ?? null;
          const ly = lyMap.get(code) ?? null;
          return { productCode: code, desc: ty.desc, tyNet: ty.net, tyQty: ty.qty, lwNet: lw?.net ?? null, lwQty: lw?.qty ?? null, lyNet: ly?.net ?? null, lyQty: ly?.qty ?? null };
        })));
      } finally {
        if (!cancelled) dispatch(setTop10Loading(false));
      }
    };
    run();
    return () => { cancelled = true; };
  }, [openSheetType, openSheetId, selectedDate]);

  // ── Computed rows ────────────────────────────────────────────────────────────
  const ledgerRows = useMemo(
    () => buildLedgerRows(weeklySales, weeklySalesLastWeek, weeklySalesLastYear),
    [weeklySales, weeklySalesLastWeek, weeklySalesLastYear],
  );

  const depts = useMemo((): DeptRow[] => {
    const lwDay = selectedDate ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0] : null;
    const lyDay = selectedDate ? sameWeekDayLastYear(selectedDate).date : null;
    const twSrc = selectedDate ? rawSubs.filter((s) => s.sale_date.startsWith(selectedDate)) : rawSubs;
    const lwSrc = lwDay ? rawLWSubs.filter((s) => s.sale_date.startsWith(lwDay)) : rawLWSubs;
    const lySrc = lyDay ? rawLYSubs.filter((s) => s.sale_date.startsWith(lyDay)) : rawLYSubs;
    const twMap = aggSubDepts(twSrc);
    const lwMap = aggSubDepts(lwSrc);
    const lyMap = aggSubDepts(lySrc);
    return Object.entries(twMap)
      .map(([id, r]) => {
        const lw = lwMap[Number(id)];
        const ly = lyMap[Number(id)];
        const lwNet = lw?.net ?? 0;
        const lyNet = ly?.net ?? 0;
        return {
          id: Number(id), desc: r.desc, tw: r.net, lw: lwNet, ly: lyNet,
          hasLW: lwNet > 0, hasLY: lyNet > 0,
          vsLWPct: lwNet ? ((r.net - lwNet) / lwNet) * 100 : 0,
          vsLYPct: lyNet ? ((r.net - lyNet) / lyNet) * 100 : 0,
          qty: r.qty, lyQty: ly?.qty ?? 0,
          digital: r.digital, lyDigital: ly?.digital ?? 0,
          elecInstore: r.elecInstore, lyElecInstore: ly?.elecInstore ?? 0,
          elecStore: r.elecStore, lyElecStore: ly?.elecStore ?? 0,
          storeCpn: r.storeCpn, lyStoreCpn: ly?.storeCpn ?? 0,
        };
      })
      .sort((a, b) => {
        const rd = SEVERITY_RANK[deptSeverity(a)] - SEVERITY_RANK[deptSeverity(b)];
        if (rd !== 0) return rd;
        return (a.hasLY ? a.vsLYPct : a.vsLWPct) - (b.hasLY ? b.vsLYPct : b.vsLWPct);
      });
  }, [rawSubs, rawLWSubs, rawLYSubs, selectedDate]);

  const hours = useMemo((): HourRow[] => {
    const lwDay = selectedDate ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0] : null;
    const lyDay = selectedDate ? sameWeekDayLastYear(selectedDate).date : null;
    const twSrc = selectedDate ? rawHourly.filter((h) => h.sale_date.startsWith(selectedDate)) : rawHourly;
    const lwSrc = lwDay ? rawLWHourly.filter((h) => h.sale_date.startsWith(lwDay)) : rawLWHourly;
    const lySrc = lyDay ? rawLYHourly.filter((h) => h.sale_date.startsWith(lyDay)) : rawLYHourly;
    const twMap = aggHours(twSrc);
    const lwMap = aggHours(lwSrc);
    const lyMap = aggHours(lySrc);
    const allHrs = Array.from(new Set([...Object.keys(twMap)].map(Number))).sort((a, b) => a - b);
    return allHrs.map((h) => {
      const tw = twMap[h]?.net ?? 0;
      const lw = lwMap[h]?.net ?? 0;
      const ly = lyMap[h]?.net ?? 0;
      return {
        hour: h, tw, lw, ly,
        trans: twMap[h]?.trans ?? 0, lwTrans: lwMap[h]?.trans ?? 0, lyTrans: lyMap[h]?.trans ?? 0,
        qty: twMap[h]?.qty ?? 0, lwQty: lwMap[h]?.qty ?? 0, lyQty: lyMap[h]?.qty ?? 0,
        hasLW: lw > 0, hasLY: ly > 0,
        vsLWPct: lw ? ((tw - lw) / lw) * 100 : 0,
        vsLYPct: ly ? ((tw - ly) / ly) * 100 : 0,
      };
    }).sort((a, b) => {
      const rd = SEVERITY_RANK[hourSeverity(a)] - SEVERITY_RANK[hourSeverity(b)];
      if (rd !== 0) return rd;
      return (a.hasLY ? a.vsLYPct : a.vsLWPct) - (b.hasLY ? b.vsLYPct : b.vsLWPct);
    });
  }, [rawHourly, rawLWHourly, rawLYHourly, selectedDate]);

  // ── Resolve sheet row from id ────────────────────────────────────────────────
  const sheetDept = openSheetType === "subdept" ? depts.find((d) => d.id === openSheetId) ?? null : null;
  const sheetHour = openSheetType === "hourly" ? hours.find((h) => h.hour === openSheetId) ?? null : null;
  const sheetRow = sheetDept ?? sheetHour;
  const sheetSev: Severity | null = sheetDept ? deptSeverity(sheetDept) : sheetHour ? hourSeverity(sheetHour) : null;

  // ── KPI strip values — dynamic based on selectedDate ─────────────────────────
  const sortedDays = selection ? [...selection.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date)) : [];
  const activeDay = selectedDate ? sortedDays.find((d) => d.sale_date.startsWith(selectedDate)) : null;
  const kpiTW = activeDay ? activeDay.twNet : sortedDays.reduce((acc, d) => acc + d.twNet, 0);
  const kpiLW = activeDay ? activeDay.lwNet : sortedDays.reduce((acc, d) => acc + d.lwNet, 0);
  const kpiLY = activeDay ? activeDay.lyNet : sortedDays.reduce((acc, d) => acc + d.lyNet, 0);
  const kpiVsLW = kpiLW > 0 ? ((kpiTW - kpiLW) / kpiLW) * 100 : null;
  const kpiVsLY = kpiLY > 0 ? ((kpiTW - kpiLY) / kpiLY) * 100 : null;

  // ── Navigation handlers ───────────────────────────────────────────────────────
  const handleOpenStore = (row: LedgerRowData) => {
    const sorted = [...row.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
    dispatch(navigateToReport({
      storeId: row.storeid, storeName: row.store_name, storeNumber: row.store_number,
      start: sorted[0]?.sale_date.split("T")[0] ?? "",
      end: sorted[sorted.length - 1]?.sale_date.split("T")[0] ?? "",
      mode: "weekly", days: sorted,
    }));
  };

  const handleOpenSheet = (type: "subdept" | "hourly", id: number) => {
    dispatch(openSheet({ type, id }));
  };

  // ── Entry state ──────────────────────────────────────────────────────────────
  const hasSelection = search.type === "Store" ? search.lastStore > 0 : search.lastGroup > 0;

  if (!hasSearched) {
    return (
      <div className="flex flex-col h-screen">
        <div className="px-5 pt-10 pb-6">
          <div className="text-content text-[20px] font-semibold">Weekly Performance</div>
          <div className="text-content/65 text-[12px]">Select a store or group and end date</div>
        </div>
        <div className="mx-4 bg-white rounded-2xl px-4 py-5 flex flex-col gap-4 shadow-md border border-gray-100">
          <StorePicker />
          <SingleDatePicker />
          <button
            onClick={fetchLedger}
            disabled={!hasSelection || ledgerLoading}
            className="w-full bg-[#1e2a4a] text-white font-semibold text-[14px] py-3.5 rounded-xl disabled:opacity-40 transition-opacity"
          >
            {ledgerLoading ? "Loading…" : "Load stores"}
          </button>
        </div>
      </div>
    );
  }

  if (ledgerLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <div className="text-content/65 text-[13px]">Loading stores…</div>
      </div>
    );
  }

  // ── Screen 1: Store list ─────────────────────────────────────────────────────
  if (screen === "list") {
    const filtered = listSevFilter === "all" ? ledgerRows : ledgerRows.filter((r) => r.severity === listSevFilter);
    const critRows = filtered.filter((r) => r.severity === "critical");
    const watchRows = filtered.filter((r) => r.severity === "watch");
    const healthyRows = filtered.filter((r) => r.severity === "healthy");
    const counts: Record<SevFilter, number> = {
      all: ledgerRows.length,
      critical: ledgerRows.filter((r) => r.severity === "critical").length,
      watch: ledgerRows.filter((r) => r.severity === "watch").length,
      healthy: ledgerRows.filter((r) => r.severity === "healthy").length,
    };
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex-shrink-0">
          <div className="text-white font-semibold text-[15px]">Weekly performance</div>
          <div className="text-white/65 text-[11px] mt-0.5">{weekLabel}</div>
        </div>
        <SevChips active={listSevFilter} counts={counts} onChange={(f) => dispatch(setListSevFilter(f))} />
        <div className="flex-1 overflow-y-auto">
          {critRows.length > 0 && <div><SectionHeader sev="critical" count={critRows.length} />{critRows.map((r) => <StoreRow key={r.storeid} row={r} onClick={handleOpenStore} />)}</div>}
          {watchRows.length > 0 && <div><SectionHeader sev="watch" count={watchRows.length} />{watchRows.map((r) => <StoreRow key={r.storeid} row={r} onClick={handleOpenStore} />)}</div>}
          {healthyRows.length > 0 && <div><SectionHeader sev="healthy" count={healthyRows.length} />{healthyRows.map((r) => <StoreRow key={r.storeid} row={r} onClick={handleOpenStore} />)}</div>}
          {filtered.length === 0 && <div className="flex items-center justify-center py-16 text-[12px] text-content/50">No stores match filter</div>}
        </div>
      </div>
    );
  }

  // ── Screen 2: Store report ───────────────────────────────────────────────────
  const signalItems = tab === "subdept"
    ? depts.map((r) => ({ sev: deptSeverity(r), label: r.desc, vsLYPct: r.vsLYPct, vsLWPct: r.vsLWPct, hasLY: r.hasLY, hasLW: r.hasLW, onClick: () => handleOpenSheet("subdept", r.id) }))
    : hours.map((r) => ({ sev: hourSeverity(r), label: `${ampm(r.hour)} – ${ampm(r.hour + 1 <= 23 ? r.hour + 1 : 0)}`, vsLYPct: r.vsLYPct, vsLWPct: r.vsLWPct, hasLY: r.hasLY, hasLW: r.hasLW, onClick: () => handleOpenSheet("hourly", r.hour) }));

  const filteredSignals = reportSevFilter === "all" ? signalItems : signalItems.filter((i) => i.sev === reportSevFilter);
  const reportCounts: Record<SevFilter, number> = {
    all: signalItems.length,
    critical: signalItems.filter((i) => i.sev === "critical").length,
    watch: signalItems.filter((i) => i.sev === "watch").length,
    healthy: signalItems.filter((i) => i.sev === "healthy").length,
  };

  const sheetTW = sheetRow?.tw ?? 0;
  const sheetLW = sheetRow?.lw ?? 0;
  const sheetLY = sheetRow?.ly ?? 0;
  const sheetHasLW = sheetRow?.hasLW ?? false;
  const sheetHasLY = sheetRow?.hasLY ?? false;
  const sheetVsLW = sheetHasLW ? ((sheetTW - sheetLW) / sheetLW) * 100 : null;
  const sheetVsLY = sheetHasLY ? ((sheetTW - sheetLY) / sheetLY) * 100 : null;

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Nav */}
        <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
          <button onClick={() => dispatch(navigateToList())} className="text-white/75 mt-0.5 flex-shrink-0">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="text-white font-semibold text-[15px]">
              {selection?.storeNumber} · {selection?.storeName}
            </div>
            <div className="text-white/65 text-[11px]">Weekly Sales Report</div>
          </div>
        </div>

        {/* KPI strip — values + labels update with day selection */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="px-3 py-2">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content/65">TY net sales</div>
            <div className="text-[8px] italic text-content/50 mt-0.5">{twDateLabel}</div>
            <div className="text-[12px] font-semibold text-content mt-0.5">{formatCurrency2(kpiTW)}</div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content/65">vs last week</div>
            <div className="text-[8px] italic text-content/50 mt-0.5">{lwDateLabel}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">{formatCurrency2(kpiLW)}</span>
              {kpiVsLW !== null && <span className={`text-[10px] font-semibold ${kpiVsLW >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(kpiVsLW)}</span>}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content/65">vs last year</div>
            <div className="text-[8px] italic text-content/50 mt-0.5">{lyDateLabel}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">{formatCurrency2(kpiLY)}</span>
              {kpiVsLY !== null && <span className={`text-[10px] font-semibold ${kpiVsLY >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(kpiVsLY)}</span>}
            </div>
          </div>
        </div>

        {/* Day strip — 8 equal columns: ALL + 7 days */}
        <div className="grid grid-cols-8 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => dispatch(setLedgerSelectedDate(null))}
            className={`flex flex-col items-center justify-center py-2 border-r border-gray-100 transition-colors ${selectedDate === null ? "bg-[#1e2a4a]" : "hover:bg-gray-50"}`}
          >
            <span className={`text-[9px] font-bold ${selectedDate === null ? "text-white" : "text-content"}`}>ALL</span>
            <span className={`text-[8px] mt-0.5 ${selectedDate === null ? "text-white/65" : "text-content/65"}`}>wk</span>
          </button>
          {sortedDays.map((d) => {
            const dateStr = d.sale_date.split("T")[0];
            const date = new Date(dateStr + "T12:00:00");
            const isSelected = selectedDate === dateStr;
            const hasLY = d.lyNet > 0;
            const hasLW = d.lwNet > 0;
            const ref = hasLY ? d.lyNet : hasLW ? d.lwNet : 0;
            const hasRef = hasLY || hasLW;
            const refPct = hasRef ? ((d.twNet - ref) / ref) * 100 : 0;
            const isNeg = refPct < 0;
            const dayBadgeBg = !hasRef ? "#e5e7eb" : isNeg ? "#fee2e2" : "#d1fae5";
            const dayBadgeColor = !hasRef ? "#9ca3af" : isNeg ? "#ef4444" : "#10b981";
            return (
              <button
                key={dateStr}
                onClick={() => dispatch(setLedgerSelectedDate(isSelected ? null : dateStr))}
                className={`flex flex-col items-center justify-center gap-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors ${isSelected ? "bg-[#1e2a4a]" : "hover:bg-gray-50"}`}
              >
                <span className={`text-[9px] font-semibold leading-none ${isSelected ? "text-white" : "text-content"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  <span className={isSelected ? "text-white/65" : "text-content/65"}>
                    {date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                  </span>
                </span>
                <div
                  className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0"
                  style={{ background: dayBadgeBg }}
                >
                  {!hasRef
                    ? <span className="text-[7px] font-bold" style={{ color: dayBadgeColor }}>—</span>
                    : isNeg
                      ? <ExclamationTriangleIcon className="w-2.5 h-2.5" style={{ color: dayBadgeColor }} />
                      : <CheckCircleIcon className="w-2.5 h-2.5" style={{ color: dayBadgeColor }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-100 flex-shrink-0">
          {(["subdept", "hourly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { dispatch(setLedgerTab(t)); dispatch(closeSheet()); }}
              className={`flex-1 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${tab === t ? "border-[#1e2a4a] text-content" : "border-transparent text-content/65"}`}
            >
              {t === "subdept" ? "Sub dept" : "Hourly"}
            </button>
          ))}
        </div>

        {/* Signal filter chips */}
        <SevChips active={reportSevFilter} counts={reportCounts} onChange={(f) => dispatch(setReportSevFilter(f))} />

        {/* Signal list */}
        <div className="flex-1 overflow-y-auto">
          {reportLoading ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/65">Loading…</div>
          ) : filteredSignals.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/50">No data</div>
          ) : (
            (["critical", "watch", "healthy"] as Severity[]).map((sev) => {
              const group = filteredSignals.filter((i) => i.sev === sev);
              if (!group.length) return null;
              return (
                <div key={sev}>
                  <SectionHeader sev={sev} count={group.length} />
                  {group.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.onClick}
                      className="flex items-center w-full px-3 py-3 gap-2.5 bg-white border-b border-gray-100 last:border-0 text-left active:bg-gray-50"
                    >
                      <SevBadge sev={item.sev} />
                      <span className="flex-1 text-[12px] font-medium text-content truncate">{item.label}</span>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className={`text-[11px] font-medium ${item.hasLY ? (item.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500") : "text-content/55"}`}>
                          LY {item.hasLY ? formatPct(item.vsLYPct) : "—"}
                        </span>
                        {item.hasLW && (
                          <span className={`text-[11px] font-medium ${item.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            LW {formatPct(item.vsLWPct)}
                          </span>
                        )}
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-content/40 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      {openSheetType && sheetRow && sheetSev && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/35" onClick={() => dispatch(closeSheet())} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-2.5 flex-shrink-0">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>
            {/* Sheet header */}
            <div className="flex items-start justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="text-[14px] font-semibold text-content">
                  {openSheetType === "subdept" && sheetDept ? sheetDept.desc : openSheetType === "hourly" && sheetHour ? ampm(sheetHour.hour) : ""}
                </div>
                <div className="text-[10px] text-content/65 italic mt-0.5">{twDateLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: BADGE_BG[sheetSev], color: BADGE_COLOR[sheetSev] }}
                >
                  {sheetSev === "critical" && <ExclamationTriangleIcon className="w-3 h-3" />}
                  {sheetSev === "watch" && <ExclamationCircleIcon className="w-3 h-3" />}
                  {sheetSev === "healthy" && <CheckCircleIcon className="w-3 h-3" />}
                  {sheetSev.charAt(0).toUpperCase() + sheetSev.slice(1)}
                </div>
                <button onClick={() => dispatch(closeSheet())} className="text-content/50 p-0.5">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable metrics */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* TY net */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-[12px] text-content/90">TY net sales</span>
                <span className="text-[13px] font-semibold text-content">{formatCurrency2(sheetTW)}</span>
              </div>
              {/* ↳ vs LW */}
              <div className="flex items-start justify-between px-4 py-2.5 pl-8 border-b border-gray-50">
                <div>
                  <div className="text-[11px] text-content/75">↳ vs last week</div>
                  <div className="text-[9px] text-content/65 italic">{lwDateLabel}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] text-content/85">{sheetHasLW ? formatCurrency2(sheetLW) : "—"}</span>
                  {sheetVsLW !== null && <span className={`text-[11px] font-semibold ${sheetVsLW >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(sheetVsLW)}</span>}
                </div>
              </div>
              {/* ↳ vs LY */}
              <div className="flex items-start justify-between px-4 py-2.5 pl-8 border-b border-gray-100">
                <div>
                  <div className="text-[11px] text-content/75">↳ vs last year</div>
                  <div className="text-[9px] text-content/65 italic">{lyDateLabel}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] text-content/85">{sheetHasLY ? formatCurrency2(sheetLY) : "—"}</span>
                  {sheetVsLY !== null && <span className={`text-[11px] font-semibold ${sheetVsLY >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(sheetVsLY)}</span>}
                </div>
              </div>
              {/* Units sold */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-[12px] text-content/90">Units sold</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[13px] font-medium text-content">
                    {sheetRow.qty.toLocaleString()}
                  </span>
                  {openSheetType === "subdept" && sheetDept && sheetDept.lyQty > 0 && (
                    <span className={`text-[10px] ${sheetDept.qty >= sheetDept.lyQty ? "text-emerald-600" : "text-red-500"}`}>
                      {formatPct(((sheetDept.qty - sheetDept.lyQty) / sheetDept.lyQty) * 100)} vs LY
                    </span>
                  )}
                </div>
              </div>
              {/* Hourly extras */}
              {openSheetType === "hourly" && sheetHour && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-[12px] text-content/90">Transactions</span>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[13px] font-medium text-content">{sheetHour.trans.toLocaleString()}</span>
                      {sheetHour.lyTrans > 0 && (
                        <span className={`text-[10px] ${sheetHour.trans >= sheetHour.lyTrans ? "text-emerald-600" : "text-red-500"}`}>
                          {formatPct(((sheetHour.trans - sheetHour.lyTrans) / sheetHour.lyTrans) * 100)} vs LY
                        </span>
                      )}
                    </div>
                  </div>
                  {sheetHour.trans > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="text-[12px] text-content/90">Avg basket</span>
                      <span className="text-[13px] font-medium text-content">{formatCurrency2(sheetTW / sheetHour.trans)}</span>
                    </div>
                  )}
                </>
              )}

              {/* Top 10 items (subdept only) */}
              {openSheetType === "subdept" && (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 border-t border-t-gray-100">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-content/65">Top 10 items</span>
                    <span className="text-[9px] italic text-content/50">by qty · {twDateLabel}</span>
                  </div>
                  {top10Loading ? (
                    <div className="px-4 py-3 text-[11px] text-content/65 italic">Loading…</div>
                  ) : top10.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-content/50 italic">No data</div>
                  ) : top10.map((item, i) => {
                    const lyPct = item.lyNet !== null && item.lyNet > 0 ? ((item.tyNet - item.lyNet) / item.lyNet) * 100 : null;
                    const lwPct = item.lwNet !== null && item.lwNet > 0 ? ((item.tyNet - item.lwNet) / item.lwNet) * 100 : null;
                    return (
                      <div key={item.productCode} className="px-4 py-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-content/50 w-4 flex-shrink-0 text-right">{i + 1}</span>
                          <span className="flex-1 text-[12px] font-medium text-content truncate pl-0.5">{item.desc}</span>
                          <span className="text-[10px] text-content/65 flex-shrink-0">{item.tyQty.toLocaleString()} u</span>
                          <span className="text-[12px] font-semibold text-content flex-shrink-0 w-16 text-right">{formatCurrency2(item.tyNet)}</span>
                        </div>
                        {(lwPct !== null || lyPct !== null) && (
                          <div className="flex gap-3 mt-1 pl-6">
                            {lwPct !== null && <span className={`text-[10px] font-medium ${lwPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>LW {formatPct(lwPct)}</span>}
                            {lyPct !== null && <span className={`text-[10px] font-medium ${lyPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>LY {formatPct(lyPct)}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesLedgerMobile;
