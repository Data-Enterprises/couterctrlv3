import { useState, useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";

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
}

const PopupSubDeptList = ({ twDateLabel, lwDateLabel, lyDateLabel }: PopupSubDeptListProps) => {
  const { subSales, subSalesWk2, subSalesWk3 } = useAppSelector((state) => state.sales);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

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
      <div className="flex items-center justify-center h-32 text-content/30 text-sm">
        No sub department data
      </div>
    );
  }

  const chipClass = (active: boolean, sev?: Severity) => {
    if (!active) return "bg-white border border-gray-200 text-content/50 hover:border-gray-400";
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
      <div className="flex flex-col border-r border-gray-100" style={{ width: "40%" }}>
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setSevFilter("all")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "all")}`}
          >
            All ({rows.length})
          </button>
          <button
            onClick={() => setSevFilter("critical")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "critical", "critical")}`}
          >
            <ExclamationTriangleIcon className="w-2.5 h-2.5" />
            Crit ({critCount})
          </button>
          <button
            onClick={() => setSevFilter("watch")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "watch", "watch")}`}
          >
            <ExclamationCircleIcon className="w-2.5 h-2.5" />
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter("healthy")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "healthy", "healthy")}`}
          >
            <CheckCircleIcon className="w-2.5 h-2.5" />
            OK ({healthyCount})
          </button>
        </div>

        {/* Column header */}
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[9px] font-medium text-content/40 uppercase tracking-wide">
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
                  className={`text-[11px] font-medium flex-1 truncate ${
                    isSel ? "text-white" : "text-content"
                  }`}
                >
                  {r.desc}
                </span>
                <span
                  className={`text-[11px] font-semibold flex-shrink-0 ${
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
              <span className="text-[12px] font-semibold text-content">{selected.desc}</span>
              <span className="text-[9px] text-content/30 italic">{twDateLabel}</span>
            </div>

            {/* Metrics */}
            <div className="px-4 py-1 flex-1 overflow-y-auto thin-scrollbar">
              {/* TY net */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[11px] text-content/70">TY net sales</span>
                <span className="text-[12px] font-semibold text-content">
                  {formatCurrency2(selected.tw)}
                </span>
              </div>

              {/* ↳ vs LW */}
              <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-content/50">↳ vs last week</span>
                  <span className="text-[8px] text-content/30 italic">{lwDateLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-content/60">
                    {selected.hasLW ? formatCurrency2(selected.lw) : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
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
                  <span className="text-[10px] text-content/50">↳ vs last year</span>
                  <span className="text-[8px] text-content/30 italic">{lyDateLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-content/60">
                    {selected.hasLY ? formatCurrency2(selected.ly) : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selected.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {selected.hasLY ? formatPct(selected.vsLYPct) : "—"}
                  </span>
                </div>
              </div>

              {/* Units sold */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[11px] text-content/70">Units sold</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] font-medium text-content">
                    {selected.qty.toLocaleString()}
                  </span>
                  {selected.lyQty > 0 && (
                    <span
                      className={`text-[10px] ${
                        selected.qty >= selected.lyQty ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatPct(((selected.qty - selected.lyQty) / selected.lyQty) * 100)} vs LY
                    </span>
                  )}
                </div>
              </div>

              {/* Coupons */}
              {(selected.digital > 0 || selected.elecInstore > 0 || selected.elecStore > 0 || selected.storeCpn > 0) && (
                <div className="py-2 border-b border-gray-100">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/30 mb-1.5">
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
                          <span className="text-[9px] text-content/40">{label}</span>
                          <span className="text-[10px] font-medium text-content/70">
                            {formatCurrency2(tw)}
                          </span>
                          {pct !== null && (
                            <span
                              className={`text-[9px] font-medium ${
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
                  className={`text-[10px] leading-relaxed ${
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
          <div className="flex items-center justify-center h-full text-[11px] text-content/20">
            Select a sub department
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupSubDeptList;
