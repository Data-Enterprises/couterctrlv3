import { useState, useMemo, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setSelectedCatId } from "../../../features/salesLedgerSlice";
import { formatCurrency2, addDays, sameWeekDayLastYear } from "../../../utils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";
import { SEVERITY_CONFIG } from "./tierColumnUtils";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const pillClass = (pct: number | null, threshold: number) => {
  if (pct === null) return "bg-gray-100 text-gray-500";
  if (pct < -threshold) return "bg-red-100 text-red-800";
  if (pct < 0) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
};

type CatRow = {
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

const catSeverity = (r: CatRow, threshold: number): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
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
    {severity === "critical" && (
      <ExclamationTriangleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
    {severity === "watch" && (
      <ExclamationCircleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
    {severity === "healthy" && (
      <CheckCircleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
  </div>
);

const getCta = (
  row: CatRow,
  threshold: number,
): { text: string; severity: Severity } => {
  const sev = catSeverity(row, threshold);
  const primaryPeriod = row.hasLY ? "LY" : "LW";
  const primaryPct = row.hasLY ? row.vsLYPct : row.vsLWPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(1)}%`;

  if (sev === "critical") {
    const secondaryNote =
      row.hasLY && row.hasLW
        ? row.vsLWPct < 0
          ? ` LW also down ${Math.abs(row.vsLWPct).toFixed(1)}% — trend is consistent.`
          : ` LW is up ${row.vsLWPct.toFixed(1)}% — decline may be seasonal vs last year.`
        : "";
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold.${secondaryNote} Check pricing and mix across items in this category.`,
    };
  }
  if (sev === "watch") {
    const secondaryNote =
      row.hasLY && row.hasLW
        ? row.vsLWPct >= 0
          ? ` Recovering vs LW — may be stabilizing.`
          : ` LW also soft — monitor for a second consecutive week.`
        : "";
    return {
      severity: "watch",
      text: `Down ${pctStr} vs ${primaryPeriod} — within the watch band.${secondaryNote}`,
    };
  }
  const secondaryHealthNote =
    row.hasLY && row.hasLW
      ? row.vsLWPct < 0
        ? ` LW is softer — watch for a developing trend.`
        : ` LW also positive.`
      : "";
  return {
    severity: "healthy",
    text: `At or above ${primaryPeriod}.${secondaryHealthNote} Contribution holding strong.`,
  };
};

interface PopupCategoryListProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  selectedDate: string | null;
}

const PopupCategoryList = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
  selectedDate,
}: PopupCategoryListProps) => {
  const { rawCats, rawLWCats, rawLYCats } = useAppSelector(
    (state) => state.salesLedger,
  );
  const rawThreshold = useAppSelector(
    (state) => state.salesLedger.categoryThreshold,
  );
  const selectedId = useAppSelector((state) => state.salesLedger.selectedCatId);
  const dispatch = useAppDispatch();

  // Grading should never move rows around on its own when the threshold input
  // is cleared — keep grading against the last valid amount so severity/sort
  // order stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(rawThreshold ?? 9);
  if (rawThreshold != null) thresholdRef.current = rawThreshold;
  const threshold = thresholdRef.current;

  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [ctaOpen, setCtaOpen] = useState(false);

  const dayFiltered = useMemo(() => {
    if (!selectedDate) return { tw: rawCats, lw: rawLWCats, ly: rawLYCats };
    const lwDay = addDays(new Date(selectedDate), -7).toISOString().split("T")[0];
    const lyDay = sameWeekDayLastYear(selectedDate).date;
    return {
      tw: rawCats.filter((c) => c.sale_date.startsWith(selectedDate)),
      lw: rawLWCats.filter((c) => c.sale_date.startsWith(lwDay)),
      ly: rawLYCats.filter((c) => c.sale_date.startsWith(lyDay)),
    };
  }, [rawCats, rawLWCats, rawLYCats, selectedDate]);

  const rows = useMemo((): CatRow[] => {
    const buildMap = (src: typeof rawCats) =>
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
          c,
        ) => {
          if (!acc[c.category])
            acc[c.category] = {
              net: 0,
              qty: 0,
              digital: 0,
              elecInstore: 0,
              elecStore: 0,
              storeCpn: 0,
            };
          acc[c.category].net += c.total_sales - c.total_tax;
          acc[c.category].qty += c.qty;
          acc[c.category].digital += c.digital_coupons;
          acc[c.category].elecInstore += c.elec_instore_coupons;
          acc[c.category].elecStore += c.elec_store_coupons;
          acc[c.category].storeCpn += c.store_coupon;
          return acc;
        },
        {},
      );

    const lwMap = buildMap(dayFiltered.lw);
    const lyMap = buildMap(dayFiltered.ly);

    const twMap = dayFiltered.tw.reduce(
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
        c,
      ) => {
        if (!acc[c.category]) {
          acc[c.category] = {
            desc: c.category_description,
            net: 0,
            qty: 0,
            digital: 0,
            elecInstore: 0,
            elecStore: 0,
            storeCpn: 0,
          };
        }
        acc[c.category].net += c.total_sales - c.total_tax;
        acc[c.category].qty += c.qty;
        acc[c.category].digital += c.digital_coupons;
        acc[c.category].elecInstore += c.elec_instore_coupons;
        acc[c.category].elecStore += c.elec_store_coupons;
        acc[c.category].storeCpn += c.store_coupon;
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
        const rankDiff =
          rank[catSeverity(a, threshold)] - rank[catSeverity(b, threshold)];
        if (rankDiff !== 0) return rankDiff;
        return (
          (a.hasLY ? a.vsLYPct : a.vsLWPct) - (b.hasLY ? b.vsLYPct : b.vsLWPct)
        );
      });
  }, [dayFiltered, threshold]);

  const critCount = rows.filter(
    (r) => catSeverity(r, threshold) === "critical",
  ).length;
  const watchCount = rows.filter(
    (r) => catSeverity(r, threshold) === "watch",
  ).length;
  const healthyCount = rows.filter(
    (r) => catSeverity(r, threshold) === "healthy",
  ).length;

  const visible =
    sevFilter === "all"
      ? rows
      : rows.filter((r) => catSeverity(r, threshold) === sevFilter);
  const selected =
    selectedId !== null
      ? (rows.find((r) => r.id === selectedId) ?? null)
      : null;
  const cta = selected ? getCta(selected, threshold) : null;

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No category data
      </div>
    );
  }

  const chipClass = (active: boolean, sev?: Severity) => {
    if (!active)
      return "bg-white border border-gray-200 text-content hover:border-gray-400";
    if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-white";
    const m: Record<Severity, string> = {
      critical: "bg-red-600 border-red-600 text-white",
      watch: "bg-amber-500 border-amber-500 text-white",
      healthy: "bg-emerald-600 border-emerald-600 text-white",
    };
    return m[sev];
  };

  return (
    <div className="flex h-full">
      {/* Left panel — signal list */}
      <div
        className="flex flex-col border-r border-gray-100"
        style={{ width: "40%" }}
      >
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-100">
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

        <div className="overflow-y-auto thin-scrollbar flex-1">
          {visible.map((r) => {
            const sev = catSeverity(r, threshold);
            const isSel = selectedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => dispatch(setSelectedCatId(isSel ? null : r.id))}
                className={`w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                style={
                  isSel
                    ? {
                        boxShadow: `inset 0 0 8px ${SEVERITY_CONFIG[sev].shadowColor}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={sev} />
                  <span className="text-[12px] font-medium flex-1 truncate text-content">
                    {r.desc}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-shrink-0">
                    <span className="text-[12px] font-semibold text-content">
                      {formatCurrency2(r.tw)}
                    </span>
                    <span className="text-[10px] text-content">
                      {r.qty.toLocaleString()} u
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-1 justify-end">
                  {r.hasLW && (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pillClass(r.vsLWPct, threshold)}`}
                    >
                      LW {formatPct(r.vsLWPct)}
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pillClass(r.hasLY ? r.vsLYPct : null, threshold)}`}
                  >
                    LY {r.hasLY ? formatPct(r.vsLYPct) : "—"}
                  </span>
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
            <span className="text-[12px] font-semibold text-content truncate">
              {selected.desc}
            </span>
            <span className="text-[10px] text-content flex-shrink-0">
              {twDateLabel}
            </span>
          </div>
        )}

        {selected ? (
          <>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {/* 3-col KPI grid: TY / LW / LY */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 leading-snug">
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content">
                    TY
                  </div>
                  <div className="text-[8px] text-content mt-0.5">
                    {twDateLabel}
                  </div>
                  <div className="text-[13px] font-semibold text-content mt-0.5">
                    {formatCurrency2(selected.tw)}
                  </div>
                  <div className="text-[11px] text-content mt-0.5">
                    {selected.qty.toLocaleString()} u
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content">
                    LW
                  </div>
                  <div className="text-[8px] text-content mt-0.5">
                    {lwDateLabel}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[13px] font-semibold text-content">
                      {selected.hasLW ? formatCurrency2(selected.lw) : "—"}
                    </span>
                    {selected.hasLW && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(selected.vsLWPct, threshold)}`}
                      >
                        {formatPct(selected.vsLWPct)}
                      </span>
                    )}
                  </div>
                  {selected.lwQty > 0 && (
                    <div className="text-[11px] text-content mt-0.5">
                      {selected.lwQty.toLocaleString()} u
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content">
                    LY
                  </div>
                  <div className="text-[8px] text-content mt-0.5">
                    {lyDateLabel}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[13px] font-semibold text-content">
                      {selected.hasLY ? formatCurrency2(selected.ly) : "—"}
                    </span>
                    {selected.hasLY && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(selected.vsLYPct, threshold)}`}
                      >
                        {formatPct(selected.vsLYPct)}
                      </span>
                    )}
                  </div>
                  {selected.lyQty > 0 && (
                    <div className="text-[11px] text-content mt-0.5">
                      {selected.lyQty.toLocaleString()} u
                    </div>
                  )}
                </div>
              </div>

              {/* Coupons */}
              {(selected.digital > 0 ||
                selected.elecInstore > 0 ||
                selected.elecStore > 0 ||
                selected.storeCpn > 0) && (
                <div className="py-2 px-4 border-b border-gray-100">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content mb-1.5">
                    Coupons
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      {
                        label: "Digital",
                        tw: selected.digital,
                        ly: selected.lyDigital,
                      },
                      {
                        label: "Elec in-store",
                        tw: selected.elecInstore,
                        ly: selected.lyElecInstore,
                      },
                      {
                        label: "Elec store",
                        tw: selected.elecStore,
                        ly: selected.lyElecStore,
                      },
                      {
                        label: "Store coupon",
                        tw: selected.storeCpn,
                        ly: selected.lyStoreCpn,
                      },
                    ].map(({ label, tw, ly }) => {
                      const pct = ly > 0 ? ((tw - ly) / ly) * 100 : null;
                      return (
                        <div key={label} className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-content">
                            {label}
                          </span>
                          <span className="text-[11px] font-medium text-content">
                            {formatCurrency2(tw)}
                          </span>
                          {pct !== null && (
                            <span
                              className={`text-[10px] font-medium ${pct >= 0 ? "text-emerald-600" : "text-red-500"}`}
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
                className={`mx-3 mb-3 mt-1 rounded-md overflow-hidden ${cta.severity === "critical" ? "border border-orange-200" : cta.severity === "watch" ? "border border-amber-200" : "border border-emerald-200"}`}
              >
                <button
                  onClick={() => setCtaOpen((v) => !v)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${cta.severity === "critical" ? "bg-orange-50 hover:bg-orange-100" : cta.severity === "watch" ? "bg-amber-50 hover:bg-amber-100" : "bg-emerald-50 hover:bg-emerald-100"} transition-colors`}
                >
                  {cta.severity === "critical" && (
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  )}
                  {cta.severity === "watch" && (
                    <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  )}
                  {cta.severity === "healthy" && (
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-[10px] font-medium flex-1 text-left ${cta.severity === "critical" ? "text-orange-800" : cta.severity === "watch" ? "text-amber-800" : "text-emerald-800"}`}
                  >
                    Insight
                  </span>
                  {ctaOpen ? (
                    <ChevronUpIcon className="w-3 h-3 text-content/40" />
                  ) : (
                    <ChevronDownIcon className="w-3 h-3 text-content/40" />
                  )}
                </button>
                {ctaOpen && (
                  <div
                    className={`px-2.5 py-2 ${cta.severity === "critical" ? "bg-orange-50" : cta.severity === "watch" ? "bg-amber-50" : "bg-emerald-50"}`}
                  >
                    <span
                      className={`text-[11px] leading-relaxed ${cta.severity === "critical" ? "text-orange-900" : cta.severity === "watch" ? "text-amber-900" : "text-emerald-900"}`}
                    >
                      {cta.text}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content">
            Select a category
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupCategoryList;
