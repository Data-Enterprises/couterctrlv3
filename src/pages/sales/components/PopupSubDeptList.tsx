import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2, addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../utils";
import { getSubMargins } from "../../../api/subMargins";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";
import type { SubDeptMargin } from "../../../interfaces";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

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
  desc: string;
  tyNet: number;
  tyQty: number;
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
};

const aggregateByCode = (
  items: SubDeptMargin[],
): Map<string, { desc: string; net: number; qty: number }> => {
  const map = new Map<string, { desc: string; net: number; qty: number }>();
  for (const item of items) {
    const existing = map.get(item.product_code);
    if (existing) {
      existing.net += item.total_sales - item.total_tax;
      existing.qty += item.qty;
    } else {
      map.set(item.product_code, {
        desc: item.product_description,
        net: item.total_sales - item.total_tax,
        qty: item.qty,
      });
    }
  }
  return map;
};

const THRESHOLD = 9;

const deptSeverity = (r: DeptRow): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -THRESHOLD) return "critical";
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

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const bg = BADGE_BG[severity];
  const color = BADGE_COLOR[severity];
  return (
    <div
      className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
      style={{ background: bg }}
    >
      {severity === "critical" && <ExclamationTriangleIcon className="w-3 h-3" style={{ color }} />}
      {severity === "watch" && <ExclamationCircleIcon className="w-3 h-3" style={{ color }} />}
      {severity === "healthy" && <CheckCircleIcon className="w-3 h-3" style={{ color }} />}
    </div>
  );
};

const getCta = (row: DeptRow): { text: string; severity: Severity } => {
  const sev = deptSeverity(row);
  if (sev === "critical") {
    return {
      severity: "critical",
      text: `Down vs both periods — ${Math.abs(row.vsLYPct) > Math.abs(row.vsLWPct) ? "LY gap is larger" : "LW gap is larger"}. Check receiving, shrink, and pricing.`,
    };
  }
  if (sev === "watch") {
    if (row.hasLY && row.vsLYPct < 0) {
      return {
        severity: "watch",
        text: `Below last year but recovering vs last week. Watch this trend — could be seasonal or a category shift.`,
      };
    }
    return {
      severity: "watch",
      text: `Softness vs last week despite holding vs last year. Recent dip — monitor for a second week before escalating.`,
    };
  }
  return {
    severity: "healthy",
    text: `Ahead of both comparison periods. Contribution holding strong.`,
  };
};

interface PopupSubDeptListProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  storeId: number;
  selectedDate: string | null;
}

const PopupSubDeptList = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
  storeId,
  selectedDate,
}: PopupSubDeptListProps) => {
  const { subSales, subSalesWk2, subSalesWk3 } = useAppSelector((state) => state.sales);
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [top10, setTop10] = useState<Top10Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    if (selectedId === null) {
      setTop10([]);
      return;
    }

    const twEnd = formatGoliathDate(search.singleDate);
    const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
    const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
    const lyStart = sameWeekDayLastYear(twStart).date;
    const lyEnd = sameWeekDayLastYear(twEnd).date;

    const tyStart = selectedDate ?? twStart;
    const tyEnd = selectedDate ?? twEnd;
    const lwDayStart = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwStart;
    const lwDayEnd = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwEnd;
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

        const sorted = [...tyMap.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

        const items: Top10Item[] = sorted.map(([code, ty]) => {
          const lw = lwMap.get(code) ?? null;
          const ly = lyMap.get(code) ?? null;
          return {
            productCode: code,
            desc: ty.desc,
            tyNet: ty.net,
            tyQty: ty.qty,
            lwNet: lw?.net ?? null,
            lwQty: lw?.qty ?? null,
            lyNet: ly?.net ?? null,
            lyQty: ly?.qty ?? null,
          };
        });

        setTop10(items);
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [selectedId, selectedDate, search.singleDate, context.url, context.token, storeId]);

  const rows = useMemo((): DeptRow[] => {
    const buildMap = (src: typeof subSales) =>
      src.reduce(
        (
          acc: Record<
            number,
            {
              net: number;
              qty: number;
              digital: number;
              elecInstore: number;
              elecStore: number;
              storeCpn: number;
            }
          >,
          s,
        ) => {
          if (!acc[s.sub_department])
            acc[s.sub_department] = {
              net: 0,
              qty: 0,
              digital: 0,
              elecInstore: 0,
              elecStore: 0,
              storeCpn: 0,
            };
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
      (
        acc: Record<
          number,
          {
            desc: string;
            net: number;
            qty: number;
            digital: number;
            elecInstore: number;
            elecStore: number;
            storeCpn: number;
          }
        >,
        s,
      ) => {
        if (!acc[s.sub_department]) {
          acc[s.sub_department] = {
            desc: s.sub_department_description,
            net: 0,
            qty: 0,
            digital: 0,
            elecInstore: 0,
            elecStore: 0,
            storeCpn: 0,
          };
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
        const rankDiff = rank[deptSeverity(a)] - rank[deptSeverity(b)];
        if (rankDiff !== 0) return rankDiff;
        const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
        const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
        return aPct - bPct;
      });
  }, [subSales, subSalesWk2, subSalesWk3]);

  const critCount = rows.filter((r) => deptSeverity(r) === "critical").length;
  const watchCount = rows.filter((r) => deptSeverity(r) === "watch").length;
  const healthyCount = rows.filter((r) => deptSeverity(r) === "healthy").length;

  const visible = rows.filter((r) => {
    if (sevFilter === "critical") return deptSeverity(r) === "critical";
    if (sevFilter === "watch") return deptSeverity(r) === "watch";
    if (sevFilter === "healthy") return deptSeverity(r) === "healthy";
    return true;
  });

  const selected = selectedId !== null ? rows.find((r) => r.id === selectedId) ?? null : null;
  const cta = selected ? getCta(selected) : null;

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content/40 text-sm">
        No sub department data
      </div>
    );
  }

  const chipClass = (active: boolean, sev?: Severity) => {
    if (!active) return "bg-white border border-gray-200 text-content/60 hover:border-gray-400";
    if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-white";
    const activeMap: Record<Severity, string> = {
      critical: "bg-red-600 border-red-600 text-white",
      watch: "bg-amber-500 border-amber-500 text-white",
      healthy: "bg-emerald-600 border-emerald-600 text-white",
    };
    return activeMap[sev];
  };

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="flex flex-col border-r border-gray-100" style={{ width: "36%" }}>
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setSevFilter("all")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "all")}`}
          >
            All ({rows.length})
          </button>
          <button
            onClick={() => setSevFilter("critical")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "critical", "critical")}`}
          >
            <ExclamationTriangleIcon className="w-2.5 h-2.5" />
            Crit ({critCount})
          </button>
          <button
            onClick={() => setSevFilter("watch")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "watch", "watch")}`}
          >
            <ExclamationCircleIcon className="w-2.5 h-2.5" />
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter("healthy")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "healthy", "healthy")}`}
          >
            <CheckCircleIcon className="w-2.5 h-2.5" />
            OK ({healthyCount})
          </button>
        </div>

        {/* Column header */}
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-medium text-content/50 uppercase tracking-wide">
          Sub departments
        </div>

        {/* Signal list */}
        <div className="overflow-y-auto thin-scrollbar flex-1">
          {visible.map((r) => {
            const sev = deptSeverity(r);
            const isSel = selectedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(isSel ? null : r.id)}
                className={`flex items-center w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${
                  isSel ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
                }`}
              >
                <SeverityBadge severity={sev} />
                <span
                  className={`text-[12px] font-medium flex-1 truncate ${
                    isSel ? "text-white" : "text-content"
                  }`}
                >
                  {r.desc}
                </span>
                <span
                  className={`text-[12px] font-semibold flex-shrink-0 ${
                    isSel
                      ? r.vsLYPct >= 0
                        ? "text-emerald-300"
                        : "text-red-300"
                      : r.vsLYPct >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {r.hasLY ? formatPct(r.vsLYPct) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {selected ? (
          <>
            {/* Panel header */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-content">{selected.desc}</span>
              <span className="text-[10px] text-content/40 italic">{twDateLabel}</span>
            </div>

            {/* Metrics */}
            <div className="px-4 py-1 flex-1 overflow-y-auto thin-scrollbar">
              {/* TY net */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[12px] text-content/80">TY net sales</span>
                <span className="text-[13px] font-semibold text-content">
                  {formatCurrency2(selected.tw)}
                </span>
              </div>

              {/* ↳ vs LW */}
              <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[11px] text-content/60">↳ vs last week</span>
                  <span className="text-[9px] text-content/40 italic">{lwDateLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] text-content/75">
                    {selected.hasLW ? formatCurrency2(selected.lw) : "—"}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      selected.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {selected.hasLW ? formatPct(selected.vsLWPct) : "—"}
                  </span>
                </div>
              </div>

              {/* ↳ vs LY */}
              <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[11px] text-content/60">↳ vs last year</span>
                  <span className="text-[9px] text-content/40 italic">{lyDateLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] text-content/75">
                    {selected.hasLY ? formatCurrency2(selected.ly) : "—"}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      selected.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {selected.hasLY ? formatPct(selected.vsLYPct) : "—"}
                  </span>
                </div>
              </div>

              {/* Units sold */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[12px] text-content/80">Units sold</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[12px] font-medium text-content">
                    {selected.qty.toLocaleString()}
                  </span>
                  {selected.lyQty > 0 && (
                    <span
                      className={`text-[11px] ${
                        selected.qty >= selected.lyQty ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatPct(((selected.qty - selected.lyQty) / selected.lyQty) * 100)} vs LY
                    </span>
                  )}
                </div>
              </div>

              {/* Top 10 Items */}
              <div className="border-b border-gray-100">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <span className="text-[12px] text-content/80">Top 10 items</span>
                  <span className="text-[10px] text-content/40 italic">by qty · {twDateLabel}</span>
                </div>
                {itemsLoading ? (
                  <div className="py-2 text-[11px] text-content/40 italic">Loading…</div>
                ) : top10.length === 0 ? (
                  <div className="py-2 text-[11px] text-content/30 italic">No data</div>
                ) : (
                  top10.map((item, i) => {
                    const lwPct =
                      item.lwNet !== null && item.lwNet > 0
                        ? ((item.tyNet - item.lwNet) / item.lwNet) * 100
                        : null;
                    const lyPct =
                      item.lyNet !== null && item.lyNet > 0
                        ? ((item.tyNet - item.lyNet) / item.lyNet) * 100
                        : null;
                    return (
                      <div key={item.productCode}>
                        {/* Item parent row — same style as TY net sales */}
                        <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                          <span className="text-[12px] text-content/80 truncate pr-2">
                            {i + 1}. {item.desc}
                          </span>
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            <span className="text-[13px] font-semibold text-content">
                              {formatCurrency2(item.tyNet)}
                            </span>
                            <span className="text-[10px] text-content/50">
                              {item.tyQty.toLocaleString()} units
                            </span>
                          </div>
                        </div>
                        {/* ↳ vs LW — same style as existing child rows */}
                        <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-content/60">↳ vs last week</span>
                            <span className="text-[9px] text-content/40 italic">{lwDateLabel}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {item.lwNet !== null ? (
                              <>
                                <span className="text-[11px] text-content/75">
                                  {formatCurrency2(item.lwNet)}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    lwPct === null
                                      ? "text-content/25"
                                      : lwPct >= 0
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {lwPct !== null ? formatPct(lwPct) : "—"}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-content/30 italic">no data</span>
                            )}
                          </div>
                        </div>
                        {/* ↳ vs LY — same style as existing child rows */}
                        <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-content/60">↳ vs last year</span>
                            <span className="text-[9px] text-content/40 italic">{lyDateLabel}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {item.lyNet !== null ? (
                              <>
                                <span className="text-[11px] text-content/75">
                                  {formatCurrency2(item.lyNet)}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    lyPct === null
                                      ? "text-content/25"
                                      : lyPct >= 0
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {lyPct !== null ? formatPct(lyPct) : "—"}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-content/30 italic">no data</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Coupons */}
              {(selected.digital > 0 || selected.elecInstore > 0 || selected.elecStore > 0 || selected.storeCpn > 0) && (
                <div className="py-2 border-b border-gray-100">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content/40 mb-1.5">
                    Coupons
                  </div>
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
                          <span className="text-[10px] text-content/50">{label}</span>
                          <span className="text-[11px] font-medium text-content/80">
                            {formatCurrency2(tw)}
                          </span>
                          {pct !== null && (
                            <span
                              className={`text-[10px] font-medium ${
                                pct >= 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {formatPct(pct)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CTA insight strip */}
            {cta && (
              <div
                className={`mx-3 mb-3 mt-1 rounded-md p-2.5 flex items-start gap-2 ${
                  cta.severity === "critical"
                    ? "bg-orange-50 border border-orange-200"
                    : cta.severity === "watch"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-emerald-50 border border-emerald-200"
                }`}
              >
                {cta.severity === "critical" && (
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                {cta.severity === "watch" && (
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                {cta.severity === "healthy" && (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-[11px] leading-relaxed ${
                    cta.severity === "critical"
                      ? "text-orange-900"
                      : cta.severity === "watch"
                      ? "text-amber-900"
                      : "text-emerald-900"
                  }`}
                >
                  {cta.text}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content/30">
            Select a sub department
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupSubDeptList;
