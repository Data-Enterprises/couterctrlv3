import { useState } from "react";
import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import TierStrip from "../../../components/TierStrip";
import TierColumn from "../../../components/TierColumn";

import { formatCurrency2, formatBigNumber } from "../../../utils";
import { useAppSelector, useStoreName } from "../../../hooks";
import type { CashierDetails } from "../../../interfaces";

type Severity = "critical" | "watch" | "healthy";

const SHADOW_COLOR: Record<Severity, string> = {
  critical: "rgba(239, 68, 68, 0.25)",
  watch:    "rgba(245, 158, 11, 0.25)",
  healthy:  "rgba(16, 185, 129, 0.25)",
};

const isNoDollarType = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

const storeSeverity = (detail: CashierDetails, baselineDetails: CashierDetails[], saleType: string): Severity => {
  const b = baselineDetails.find((x) => x.storeid === detail.storeid);
  if (!b) return "healthy"; // no baseline = can't grade

  const bTrans  = b.transaction_count / 2;
  const bItems  = b.total_items / 2;
  const bAmount = Math.abs(b.amount) / 2;
  const bAvg    = Math.abs(b.average_dollars);

  if (isNoDollarType(saleType)) {
    const score = [
      detail.transaction_count <= bTrans,
      detail.total_items       <= bItems,
    ].filter(Boolean).length;
    if (score === 2) return "healthy";
    if (score === 1) return "watch";
    return "critical";
  }

  const score = [
    detail.transaction_count         <= bTrans,
    detail.total_items               <= bItems,
    Math.abs(detail.amount)          <= bAmount,
    Math.abs(detail.average_dollars) <= bAvg,
  ].filter(Boolean).length;
  if (score >= 3) return "healthy";
  if (score === 2) return "watch";
  return "critical";
};

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

interface Props {
  loading: boolean;
  onSaleTypeSelect: (saleType: string) => void;
  onStoreSelect: (detail: CashierDetails) => void;
  onOpenSearch: () => void;
}

const LPStorePanel = ({ loading, onSaleTypeSelect, onStoreSelect, onOpenSearch }: Props) => {
  const cashier = useAppSelector((s) => s.lossPrevention);
  const search = useAppSelector((s) => s.search);
  const [legendHover, setLegendHover] = useState(false);

  const {
    saleTypes, selectedSaleType, cashierDetails, baselineDetails,
    selectedStoreId,
  } = cashier;

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateLabel = `${fmtRangePart(search.startDate)} – ${fmtRangePart(search.endDate, true)}`;

  const totalSales  = cashierDetails.reduce((acc, d) => acc + Math.abs(d.amount), 0);
  const totalTrans  = cashierDetails.reduce((acc, d) => acc + d.transaction_count, 0);
  const totalItems  = cashierDetails.reduce((acc, d) => acc + d.total_items, 0);

  const criticalStores = cashierDetails.filter((d) => storeSeverity(d, baselineDetails, selectedSaleType) === "critical");
  const watchStores    = cashierDetails.filter((d) => storeSeverity(d, baselineDetails, selectedSaleType) === "watch");
  const healthyStores  = cashierDetails.filter((d) => storeSeverity(d, baselineDetails, selectedSaleType) === "healthy");

  const StoreRow = ({ detail }: { detail: CashierDetails }) => {
    const sev = storeSeverity(detail, baselineDetails, selectedSaleType);
    const isSel = detail.storeid === selectedStoreId;
    const b = baselineDetails.find((x) => x.storeid === detail.storeid);
    const storeName = useStoreName(detail.storeid, detail.store_name);

    const metrics = [
      {
        label: "Cashiers",
        current: detail.cashier_count,
        trend: b ? b.cashier_count / 2 : null,
        fmt: (v: number) => String(Math.round(v)),
        showPct: false,
      },
      {
        label: "Total",
        current: detail.amount,
        trend: b ? b.amount / 2 : null,
        fmt: (v: number) => formatCurrency2(v),
        showPct: true,
        useAbs: !isNoDollarType(selectedSaleType),
      },
      {
        label: "Trans",
        current: detail.transaction_count,
        trend: b ? b.transaction_count / 2 : null,
        fmt: (v: number) => String(Math.round(v)),
        showPct: true,
      },
    ];

    return (
      <button
        onClick={() => onStoreSelect(detail)}
        className={`w-full flex flex-col px-3 py-2.5 border-b border-gray-100 transition-colors text-left gap-1.5 ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
        style={isSel ? { boxShadow: `inset 0 0 8px ${SHADOW_COLOR[sev]}` } : undefined}
      >
        <div className="text-[11px] font-medium text-content truncate w-full text-center">{storeName}</div>
        <div className="grid grid-cols-3 w-full">
          {metrics.map(({ label, current, trend: trendVal, fmt, showPct, useAbs }) => {
            const c = useAbs ? Math.abs(current) : current;
            const t = trendVal !== null && useAbs ? Math.abs(trendVal) : trendVal;
            const pct = showPct && t && t !== 0 ? ((c - t) / Math.abs(t)) * 100 : null;
            const isUp = pct !== null && pct > 0;
            return (
              <div key={label} className="px-2 py-1 text-center">
                <div className="text-[7px] text-content/45 uppercase tracking-wide">{label}</div>
                <div className="text-[10px] font-medium text-content mt-0.5">{fmt(current)}</div>
                {trendVal !== null && (
                  <div className="text-[9px] font-medium mt-0.5">{fmt(trendVal)}</div>
                )}
                {pct !== null && (
                  <div className={`text-[9px] font-medium mt-0.5 ${isUp ? "text-red-500" : "text-emerald-600"}`}>
                    {pct !== 0 ? fmtPct(pct) : "0.0%"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ width: "46%", flexShrink: 0 }}>
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0" style={{ background: "#1e2a4a" }}>
        {/* Row 1: title + date | totals */}
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-white flex-shrink-0">Loss Prevention</span>
          <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>{dateLabel}</span>
          <div className="flex-1" />
          {cashierDetails.length > 0 && (
            <>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Sales</span>
                <span className="text-[13px] font-medium text-white">{formatCurrency2(totalSales)}</span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Trans</span>
                <span className="text-[13px] font-medium text-white">{formatBigNumber(totalTrans, 0)}</span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>Items</span>
                <span className="text-[13px] font-medium text-white">{formatBigNumber(totalItems, 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* Row 2: search left | legend right */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            aria-label="Search stores"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1" />
          <span className="text-[9px] font-medium uppercase tracking-wide flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>Exception activity vs baseline</span>
          <div className="relative flex-shrink-0" onMouseEnter={() => setLegendHover(true)} onMouseLeave={() => setLegendHover(false)}>
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-1.5" style={{ minWidth: 230 }}>
                {(isNoDollarType(selectedSaleType) ? [
                  { color: "#fca5a5", label: "Critical — neither metric at or below baseline" },
                  { color: "#fcd34d", label: "Watch — 1 metric at or below baseline" },
                  { color: "#6ee7b7", label: "Healthy — both metrics at or below baseline" },
                ] : [
                  { color: "#fca5a5", label: "Critical — fewer than 2 metrics at or below baseline" },
                  { color: "#fcd34d", label: "Watch — exactly 2 metrics at or below baseline" },
                  { color: "#6ee7b7", label: "Healthy — 3 or more metrics at or below baseline" },
                ]).map(({ color, label }) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="w-[7px] h-[7px] rounded-[2px] flex-shrink-0 mt-[3px]" style={{ background: color }} />
                    <span className="text-[11px] text-white/90 leading-snug">{label}</span>
                  </div>
                ))}
                <div className="h-px bg-white/10 my-0.5" />
                <div className="text-[9px] text-white/50 leading-snug">Baseline = avg per week over the prior 2 weeks</div>
                <div className="h-px bg-white/10 my-0.5" />
                <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Metrics graded</div>
                <div className="flex flex-col gap-1">
                  {(isNoDollarType(selectedSaleType) ? [
                    "Transaction count", "Total items",
                  ] : [
                    "Transaction count", "Total items", "Exception amount", "Average dollars",
                  ]).map((m) => (
                    <div key={m} className="flex items-center gap-1.5">
                      <span className="text-white/30 text-[10px]">·</span>
                      <span className="text-[10px] text-white/90">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exception type tabs — Description excluded until further notice */}
      <div className="flex flex-shrink-0 border-b border-gray-100 overflow-x-auto no-scrollbar">
        {saleTypes.filter((st) => st.sale_type !== "Description").map((st) => (
          <button
            key={st.sale_type}
            onClick={() => onSaleTypeSelect(st.sale_type)}
            className="flex-1 text-center px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
            style={{
              borderBottom: selectedSaleType === st.sale_type ? "2px solid #1e2a4a" : "2px solid transparent",
              color: selectedSaleType === st.sale_type ? "#1e2a4a" : "var(--color-text-secondary)",
              fontWeight: selectedSaleType === st.sale_type ? 500 : 400,
            }}
          >
            {st.sale_type}
          </button>
        ))}
      </div>

      {/* Store tier columns */}
      <div className="flex-1 min-h-0 flex flex-col">
        {loading && cashierDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">Loading…</div>
        ) : cashierDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">
            {selectedSaleType ? "No stores found" : "Select an exception type"}
          </div>
        ) : (
          <>
            {/* Tier header strip */}
            <TierStrip
              critical={criticalStores.length}
              watch={watchStores.length}
              healthy={healthyStores.length}
            />

            {/* Three scrollable store columns */}
            <div className="flex-1 min-h-0 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden">
              <TierColumn emptyText="None">
                {criticalStores.length > 0 ? criticalStores.map((d) => <StoreRow key={d.storeid} detail={d} />) : undefined}
              </TierColumn>
              <TierColumn emptyText="None">
                {watchStores.length > 0 ? watchStores.map((d) => <StoreRow key={d.storeid} detail={d} />) : undefined}
              </TierColumn>
              <TierColumn emptyText="None">
                {healthyStores.length > 0 ? healthyStores.map((d) => <StoreRow key={d.storeid} detail={d} />) : undefined}
              </TierColumn>
            </div>
          </>
        )}
      </div>


    </div>
  );
};

export default LPStorePanel;
