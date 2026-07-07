import { useSalesState } from "../hooks/useSalesState";
﻿import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setItemThreshold, setExportSubDeptName, setExportSubDeptItems } from "../../../features/salesLedgerSlice";
import type { GradingMetric } from "../../../features/salesLedgerSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import { formatCurrency2, addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../utils";
import { getSubMargins } from "../../../api/subMargins";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";
import type { SubDeptMargin } from "../../../interfaces";
import { SEVERITY_CONFIG } from "./tierColumnUtils";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const pillClass = (pct: number | null, threshold: number) => {
  if (pct === null) return "bg-gray-100 text-gray-500";
  if (pct < -threshold) return "bg-red-100 text-red-800";
  if (pct < 0) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
};

type DeptRow = {
  id: number;
  desc: string;
  tw: number;
  lw: number;
  ly: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWPct: number;
  vsLYPct: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  digital: number;
  lyDigital: number;
  elecInstore: number;
  lyElecInstore: number;
  elecStore: number;
  lyElecStore: number;
  storeCpn: number;
  lyStoreCpn: number;
};

type SevFilter = "all" | "critical" | "watch" | "healthy";

type Top10Item = {
  productCode: string;
  upc: string;
  desc: string;
  tyNet: number;
  tyQty: number;
  tyWeight: number;
  lwNet: number | null;
  lwQty: number | null;
  lwWeight: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyWeight: number | null;
};

const aggregateByCode = (
  items: SubDeptMargin[],
): Map<string, { desc: string; net: number; qty: number; weight: number }> => {
  const map = new Map<string, { desc: string; net: number; qty: number; weight: number }>();
  for (const item of items) {
    const ex = map.get(item.product_code);
    if (ex) {
      ex.net += item.total_sales - item.total_tax;
      ex.qty += item.qty;
      ex.weight += item.weight;
    } else {
      map.set(item.product_code, {
        desc: item.product_description,
        net: item.total_sales - item.total_tax,
        qty: item.qty,
        weight: item.weight,
      });
    }
  }
  return map;
};

const deptSeverity = (r: DeptRow, threshold: number): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const itemSeverity = (item: Top10Item, threshold: number, metric: GradingMetric): Severity => {
  const lyPct = metric === "sales"
    ? (item.lyNet !== null && item.lyNet > 0 ? ((item.tyNet - item.lyNet) / item.lyNet) * 100 : null)
    : (item.lyQty !== null && item.lyQty > 0 ? ((item.tyQty - item.lyQty) / item.lyQty) * 100 : null);
  const lwPct = metric === "sales"
    ? (item.lwNet !== null && item.lwNet > 0 ? ((item.tyNet - item.lwNet) / item.lwNet) * 100 : null)
    : (item.lwQty !== null && item.lwQty > 0 ? ((item.tyQty - item.lwQty) / item.lwQty) * 100 : null);
  const pct = lyPct ?? lwPct ?? 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
};
const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
};

const SeverityBadge = ({ severity }: { severity: Severity }) => (
  <div
    className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
    style={{ background: BADGE_BG[severity] }}
  >
    {severity === "critical" && <ExclamationTriangleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
    {severity === "watch" && <ExclamationCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
    {severity === "healthy" && <CheckCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
  </div>
);

const getCta = (row: DeptRow, threshold: number): { text: string; severity: Severity } => {
  const sev = deptSeverity(row, threshold);
  const primaryPeriod = row.hasLY ? "LY" : "LW";
  const primaryPct = row.hasLY ? row.vsLYPct : row.vsLWPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(1)}%`;

  if (sev === "critical") {
    const secondaryNote = row.hasLY && row.hasLW
      ? row.vsLWPct < 0
        ? ` LW also down ${Math.abs(row.vsLWPct).toFixed(1)}% — trend is consistent.`
        : ` LW is up ${row.vsLWPct.toFixed(1)}% — decline may be seasonal vs last year.`
      : "";
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold.${secondaryNote} Check receiving, shrink, and pricing.`,
    };
  }
  if (sev === "watch") {
    const secondaryNote = row.hasLY && row.hasLW
      ? row.vsLWPct >= 0
        ? ` Recovering vs LW — may be stabilizing.`
        : ` LW also soft — monitor for a second consecutive week.`
      : "";
    return {
      severity: "watch",
      text: `Down ${pctStr} vs ${primaryPeriod} — within the watch band.${secondaryNote}`,
    };
  }
  const secondaryHealthNote = row.hasLY && row.hasLW
    ? row.vsLWPct < 0 ? ` LW is softer — watch for a developing trend.` : ` LW also positive.`
    : "";
  return { severity: "healthy", text: `At or above ${primaryPeriod}.${secondaryHealthNote} Contribution holding strong.` };
};

interface PopupSubDeptListProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  storeId: number;
  selectedDate: string | null;
}

const PopupSubDeptList = ({ twDateLabel, lwDateLabel, lyDateLabel, storeId, selectedDate }: PopupSubDeptListProps) => {
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const rawThreshold = useAppSelector((state) => state.salesLedger.subDeptThreshold);
  const rawItemThreshold = useAppSelector((state) => state.salesLedger.itemThreshold);
  const gradingMetric = useAppSelector((state) => state.salesLedger.gradingMetric);

  // Grading should never move rows around on its own when the threshold input
  // is cleared — keep grading against the last valid amount so severity/sort
  // order stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(rawThreshold ?? 9);
  if (rawThreshold != null) thresholdRef.current = rawThreshold;
  const threshold = thresholdRef.current;

  const itemThresholdRef = useRef<number>(rawItemThreshold ?? 9);
  if (rawItemThreshold != null) itemThresholdRef.current = rawItemThreshold;
  const itemThreshold = itemThresholdRef.current;
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [ctaOpen, setCtaOpen] = useState(false);
  const [itemSevFilter, setItemSevFilter] = useState<SevFilter>("all");
  const [items, setItems] = useState<Top10Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; upc: string } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) closeCtxMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMenu, closeCtxMenu]);

  useEffect(() => { setItemSevFilter("all"); }, [selectedId]);

  useEffect(() => {
    if (selectedId === null) { setItems([]); return; }

    const twEnd = formatGoliathDate(search.singleDate);
    const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
    const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
    const lyStart = sameWeekDayLastYear(twStart).date;
    const lyEnd = sameWeekDayLastYear(twEnd).date;

    const tyStart = selectedDate ?? twStart;
    const tyEnd = selectedDate ?? twEnd;
    const lwDayStart = selectedDate ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0] : lwStart;
    const lwDayEnd = selectedDate ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0] : lwEnd;
    const lyDayStart = selectedDate ? sameWeekDayLastYear(selectedDate).date : lyStart;
    const lyDayEnd = selectedDate ? sameWeekDayLastYear(selectedDate).date : lyEnd;

    let cancelled = false;
    const fetch = async () => {
      setItemsLoading(true);
      try {
        const [tyResp, lwResp, lyResp] = await Promise.all([
          getSubMargins(context.url, context.token, selectedId, tyStart, tyEnd, 0, storeId, 1),
          getSubMargins(context.url, context.token, selectedId, lwDayStart, lwDayEnd, 0, storeId, 1),
          getSubMargins(context.url, context.token, selectedId, lyDayStart, lyDayEnd, 0, storeId, 1),
        ]);
        if (cancelled) return;

        const tyItems: SubDeptMargin[] = tyResp.data?.error === 0 ? tyResp.data.subs : [];
        const lwItems: SubDeptMargin[] = lwResp.data?.error === 0 ? lwResp.data.subs : [];
        const lyItems: SubDeptMargin[] = lyResp.data?.error === 0 ? lyResp.data.subs : [];

        const tyMap = aggregateByCode(tyItems);
        const lwMap = aggregateByCode(lwItems);
        const lyMap = aggregateByCode(lyItems);

        const sorted = [...tyMap.entries()].sort((a, b) => b[1].qty - a[1].qty);

        setItems(sorted.map(([code, ty]) => {
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
        }));
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [selectedId, selectedDate, search.singleDate, context.url, context.token, storeId]);

  const rows = useMemo((): DeptRow[] => {
    const buildMap = (src: typeof subSales) =>
      src.reduce(
        (acc: Record<number, { net: number; qty: number; digital: number; elecInstore: number; elecStore: number; storeCpn: number }>, s) => {
          if (!acc[s.sub_department]) acc[s.sub_department] = { net: 0, qty: 0, digital: 0, elecInstore: 0, elecStore: 0, storeCpn: 0 };
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

    const lwMap = buildMap(subSalesWk2);
    const lyMap = buildMap(subSalesWk3);

    const twMap = subSales.reduce(
      (acc: Record<number, { desc: string; net: number; qty: number; digital: number; elecInstore: number; elecStore: number; storeCpn: number }>, s) => {
        if (!acc[s.sub_department]) {
          acc[s.sub_department] = { desc: s.sub_department_description, net: 0, qty: 0, digital: 0, elecInstore: 0, elecStore: 0, storeCpn: 0 };
        }
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

    return Object.entries(twMap)
      .map(([id, r]) => {
        const lw = lwMap[Number(id)];
        const ly = lyMap[Number(id)];
        const lwNet = lw?.net ?? 0;
        const lyNet = ly?.net ?? 0;
        return {
          id: Number(id),
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
        const rank = { critical: 0, watch: 1, healthy: 2 } as const;
        const rankDiff = rank[deptSeverity(a, threshold)] - rank[deptSeverity(b, threshold)];
        if (rankDiff !== 0) return rankDiff;
        return (a.hasLY ? a.vsLYPct : a.vsLWPct) - (b.hasLY ? b.vsLYPct : b.vsLWPct);
      });
  }, [subSales, subSalesWk2, subSalesWk3]);

  const critCount = rows.filter((r) => deptSeverity(r, threshold) === "critical").length;
  const watchCount = rows.filter((r) => deptSeverity(r, threshold) === "watch").length;
  const healthyCount = rows.filter((r) => deptSeverity(r, threshold) === "healthy").length;

  const visible = sevFilter === "all" ? rows : rows.filter((r) => deptSeverity(r, threshold) === sevFilter);
  const selected = selectedId !== null ? rows.find((r) => r.id === selectedId) ?? null : null;
  const cta = selected ? getCta(selected, threshold) : null;

  const itemsWithSev = useMemo(
    () => items.map((item) => ({ ...item, sev: itemSeverity(item, itemThreshold, gradingMetric) })),
    [items, itemThreshold, gradingMetric],
  );

  useEffect(() => {
    dispatch(setExportSubDeptName(selected?.desc ?? ""));
    dispatch(setExportSubDeptItems(selected ? itemsWithSev : []));
  }, [itemsWithSev, selectedId]);

  const itemCritCount = itemsWithSev.filter((i) => i.sev === "critical").length;
  const itemWatchCount = itemsWithSev.filter((i) => i.sev === "watch").length;
  const itemHealthyCount = itemsWithSev.filter((i) => i.sev === "healthy").length;
  const visibleItems = itemSevFilter === "all" ? itemsWithSev : itemsWithSev.filter((i) => i.sev === itemSevFilter);

  if (!rows.length) {
    return <div className="flex items-center justify-center h-32 text-content/45 text-sm">No sub department data</div>;
  }

  const chipClass = (active: boolean, sev?: Severity) => {
    if (!active) return "bg-white border border-gray-200 text-content/65 hover:border-gray-400";
    if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-white";
    const m: Record<Severity, string> = {
      critical: "bg-red-600 border-red-600 text-white",
      watch: "bg-amber-500 border-amber-500 text-white",
      healthy: "bg-emerald-600 border-emerald-600 text-white",
    };
    return m[sev];
  };

  return (
    <>
    <div className="flex h-full">
      {/* Left panel — signal list */}
      <div className="flex flex-col border-r border-gray-100" style={{ width: "40%" }}>
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-100">
          <button onClick={() => setSevFilter("all")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "all")}`}>All ({rows.length})</button>
          <button onClick={() => setSevFilter("critical")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "critical", "critical")}`}><ExclamationTriangleIcon className="w-2.5 h-2.5" />Crit ({critCount})</button>
          <button onClick={() => setSevFilter("watch")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "watch", "watch")}`}><ExclamationCircleIcon className="w-2.5 h-2.5" />Watch ({watchCount})</button>
          <button onClick={() => setSevFilter("healthy")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "healthy", "healthy")}`}><CheckCircleIcon className="w-2.5 h-2.5" />OK ({healthyCount})</button>
        </div>

        <div className="overflow-y-auto thin-scrollbar flex-1">
          {visible.map((r) => {
            const sev = deptSeverity(r, threshold);
            const isSel = selectedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(isSel ? null : r.id)}
                className={`w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                style={isSel ? { boxShadow: `inset 0 0 8px ${SEVERITY_CONFIG[sev].shadowColor}` } : undefined}
              >
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={sev} />
                  <span className="text-[12px] font-medium flex-1 truncate text-content">{r.desc}</span>
                  <div className="flex items-baseline gap-1.5 flex-shrink-0">
                    <span className="text-[12px] font-semibold text-content">{formatCurrency2(r.tw)}</span>
                    <span className={`text-[10px] ${isSel ? "text-content/65" : "text-content/60"}`}>{r.qty.toLocaleString()} u</span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-1 justify-end">
                  {r.hasLW && (
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pillClass(r.vsLWPct, threshold)}`}>LW {formatPct(r.vsLWPct)}</span>
                  )}
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pillClass(r.hasLY ? r.vsLYPct : null, threshold)}`}>LY {r.hasLY ? formatPct(r.vsLYPct) : "—"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header row: selected name */}
        {selected && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border-b border-gray-100">
            <span className="text-[12px] font-semibold text-content truncate">{selected.desc}</span>
            <span className="text-[10px] text-content/45 italic flex-shrink-0">{twDateLabel}</span>
            <div className="flex-1" />
            <span className="text-[10px] text-content/45 flex-shrink-0">Item Threshold</span>
            <ThresholdFilter
              value={rawItemThreshold === null ? null : { op: "gt", amount: rawItemThreshold }}
              onChange={(v) => dispatch(setItemThreshold(v?.amount ?? null))}
              showOp={false}
              suffix="%"
              inputWidth={40}
            />
          </div>
        )}

        {selected ? (
          <>

            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {/* 3-col KPI grid: TY / LW / LY */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">TY</div>
                  <div className="text-[8px] italic text-content/55 mt-0.5">{twDateLabel}</div>
                  <div className="text-[13px] font-semibold text-content mt-0.5">{formatCurrency2(selected.tw)}</div>
                  <div className="text-[11px] text-content/60 mt-0.5">{selected.qty.toLocaleString()} u</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">LW</div>
                  <div className="text-[8px] italic text-content/55 mt-0.5">{lwDateLabel}</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[13px] font-semibold text-content">{selected.hasLW ? formatCurrency2(selected.lw) : "—"}</span>
                    {selected.hasLW && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(selected.vsLWPct, threshold)}`}>{formatPct(selected.vsLWPct)}</span>}
                  </div>
                  {selected.lwQty > 0 && <div className="text-[11px] text-content/60 mt-0.5">{selected.lwQty.toLocaleString()} u</div>}
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">LY</div>
                  <div className="text-[8px] italic text-content/55 mt-0.5">{lyDateLabel}</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[13px] font-semibold text-content">{selected.hasLY ? formatCurrency2(selected.ly) : "—"}</span>
                    {selected.hasLY && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(selected.vsLYPct, threshold)}`}>{formatPct(selected.vsLYPct)}</span>}
                  </div>
                  {selected.lyQty > 0 && <div className="text-[11px] text-content/60 mt-0.5">{selected.lyQty.toLocaleString()} u</div>}
                </div>
              </div>

              {/* Items section */}
              <div className="border-b border-gray-100">
                {/* Items header */}
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 border-b border-gray-100">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-content/55 flex-shrink-0">Items</span>
                    <button onClick={() => setItemSevFilter("all")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(itemSevFilter === "all")}`}>All ({itemsWithSev.length})</button>
                    <button onClick={() => setItemSevFilter("critical")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(itemSevFilter === "critical", "critical")}`}><ExclamationTriangleIcon className="w-2.5 h-2.5" />Crit ({itemCritCount})</button>
                    <button onClick={() => setItemSevFilter("watch")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(itemSevFilter === "watch", "watch")}`}><ExclamationCircleIcon className="w-2.5 h-2.5" />Watch ({itemWatchCount})</button>
                    <button onClick={() => setItemSevFilter("healthy")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(itemSevFilter === "healthy", "healthy")}`}><CheckCircleIcon className="w-2.5 h-2.5" />OK ({itemHealthyCount})</button>
                    <div className="flex-1" />
                </div>

                {itemsLoading ? (
                  <div className="px-4 py-3 text-[11px] text-content/45 italic">Loading…</div>
                ) : visibleItems.length === 0 ? (
                  <div className="px-4 py-3 text-[11px] text-content/35 italic">No data</div>
                ) : (
                  visibleItems.map((item) => {
                    const lwNetPct = gradingMetric === "sales"
                      ? (item.lwNet !== null && item.lwNet > 0 ? ((item.tyNet - item.lwNet) / item.lwNet) * 100 : null)
                      : (item.lwQty !== null && item.lwQty > 0 ? ((item.tyQty - item.lwQty) / item.lwQty) * 100 : null);
                    const lyNetPct = gradingMetric === "sales"
                      ? (item.lyNet !== null && item.lyNet > 0 ? ((item.tyNet - item.lyNet) / item.lyNet) * 100 : null)
                      : (item.lyQty !== null && item.lyQty > 0 ? ((item.tyQty - item.lyQty) / item.lyQty) * 100 : null);
                    return (
                      <div
                        key={item.productCode}
                        className="px-3 py-2.5 border-b border-gray-100"
                        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, upc: item.upc }); }}
                      >
                        <div className="flex items-start gap-2">
                          <SeverityBadge severity={item.sev} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[12px] font-medium text-content truncate" style={{ maxWidth: "55%" }}>{item.desc}</span>
                              <span className="text-[10px] text-content/75 flex-shrink-0">{item.upc}</span>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-gray-100 mt-1.5">
                              <div className="px-2 py-1">
                                <div className="text-[8px] text-content/60 uppercase tracking-wide">TW</div>
                                <div className="text-[11px] font-semibold text-content mt-0.5">{formatCurrency2(item.tyNet)}</div>
                                <div className="text-[10px] text-content/60 mt-0.5">{item.tyQty.toLocaleString()} u</div>
                                {item.tyWeight > 0 && <div className="text-[10px] text-content/60 mt-0.5">{item.tyWeight.toFixed(2)} lb</div>}
                              </div>
                              <div className="px-2 py-1">
                                <div className="text-[8px] text-content/60 uppercase tracking-wide">LW</div>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-[11px] font-semibold text-content">{item.lwNet !== null ? formatCurrency2(item.lwNet) : "—"}</span>
                                  {lwNetPct !== null && <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${pillClass(lwNetPct, itemThreshold)}`}>{formatPct(lwNetPct)}</span>}
                                </div>
                                {item.lwQty !== null && <div className="text-[10px] text-content/60 mt-0.5">{item.lwQty.toLocaleString()} u</div>}
                                {item.lwWeight !== null && item.lwWeight > 0 && <div className="text-[10px] text-content/60 mt-0.5">{item.lwWeight.toFixed(2)} lb</div>}
                              </div>
                              <div className="px-2 py-1">
                                <div className="text-[8px] text-content/60 uppercase tracking-wide">LY</div>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-[11px] font-semibold text-content">{item.lyNet !== null ? formatCurrency2(item.lyNet) : "—"}</span>
                                  {lyNetPct !== null && <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${pillClass(lyNetPct, itemThreshold)}`}>{formatPct(lyNetPct)}</span>}
                                </div>
                                {item.lyQty !== null && <div className="text-[10px] text-content/60 mt-0.5">{item.lyQty.toLocaleString()} u</div>}
                                {item.lyWeight !== null && item.lyWeight > 0 && <div className="text-[10px] text-content/60 mt-0.5">{item.lyWeight.toFixed(2)} lb</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Coupons */}
              {(selected.digital > 0 || selected.elecInstore > 0 || selected.elecStore > 0 || selected.storeCpn > 0) && (
                <div className="py-2 px-4 border-b border-gray-100">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content/45 mb-1.5">Coupons</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      { label: "Digital", tw: selected.digital, ly: selected.lyDigital },
                      { label: "Elec in-store", tw: selected.elecInstore, ly: selected.lyElecInstore },
                      { label: "Elec store", tw: selected.elecStore, ly: selected.lyElecStore },
                      { label: "Store coupon", tw: selected.storeCpn, ly: selected.lyStoreCpn },
                    ].map(({ label, tw, ly }) => {
                      const pct = ly > 0 ? ((tw - ly) / ly) * 100 : null;
                      return (
                        <div key={label} className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-content/55">{label}</span>
                          <span className="text-[11px] font-medium text-content/80">{formatCurrency2(tw)}</span>
                          {pct !== null && <span className={`text-[10px] font-medium ${pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(pct)}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CTA insight strip */}
            {cta && (
              <div className={`mx-3 mb-3 mt-1 rounded-md overflow-hidden ${cta.severity === "critical" ? "border border-orange-200" : cta.severity === "watch" ? "border border-amber-200" : "border border-emerald-200"}`}>
                <button
                  onClick={() => setCtaOpen((v) => !v)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${cta.severity === "critical" ? "bg-orange-50 hover:bg-orange-100" : cta.severity === "watch" ? "bg-amber-50 hover:bg-amber-100" : "bg-emerald-50 hover:bg-emerald-100"} transition-colors`}
                >
                  {cta.severity === "critical" && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />}
                  {cta.severity === "watch" && <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                  {cta.severity === "healthy" && <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                  <span className={`text-[10px] font-medium flex-1 text-left ${cta.severity === "critical" ? "text-orange-800" : cta.severity === "watch" ? "text-amber-800" : "text-emerald-800"}`}>Insight</span>
                  {ctaOpen ? <ChevronUpIcon className="w-3 h-3 text-content/40" /> : <ChevronDownIcon className="w-3 h-3 text-content/40" />}
                </button>
                {ctaOpen && (
                  <div className={`px-2.5 py-2 ${cta.severity === "critical" ? "bg-orange-50" : cta.severity === "watch" ? "bg-amber-50" : "bg-emerald-50"}`}>
                    <span className={`text-[11px] leading-relaxed ${cta.severity === "critical" ? "text-orange-900" : cta.severity === "watch" ? "text-amber-900" : "text-emerald-900"}`}>{cta.text}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content/35">Select a sub department</div>
        )}
      </div>
    </div>

    {ctxMenu && (
      <div
        ref={ctxMenuRef}
        style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 9999 }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
      >
        <button
          className="w-full text-left px-3 py-2 text-[12px] text-content hover:bg-gray-50 transition-colors"
          onClick={() => { navigator.clipboard.writeText(ctxMenu.upc); closeCtxMenu(); }}
        >
          Copy UPC
        </button>
      </div>
    )}
    </>
  );
};

export default PopupSubDeptList;
