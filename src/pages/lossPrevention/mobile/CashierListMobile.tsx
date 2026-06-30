import { useMemo, useState } from "react";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setSelectedCashier } from "../../../features/lossPreventionSlice";
import { gradeAllCashiers } from "../gradingUtils";
import type { CashierSeverity } from "../gradingUtils";
import { formatCurrency2 } from "../../../utils";
import SevBadge from "../../sales/mobile/components/SevBadge";
import SevChips from "../../sales/mobile/components/SevChips";
import type { SevFilter } from "../../../features/salesLedgerSlice";

interface Props {
  onBack: () => void;
  onSelectCashier: () => void;
}

const toSevBadge = (s: CashierSeverity): "critical" | "watch" | "healthy" => s === "ok" ? "healthy" : s;

const MetricChip = ({ label, value, isPass }: { label: string; value: string; isPass: boolean }) => (
  <div className={`flex items-baseline gap-1 rounded px-1.5 py-0.5 ${isPass ? "bg-emerald-400 text-white" : "bg-red-400 text-white"}`}>
    <span className="text-[9px] opacity-80">{label}</span>
    <span className="text-[10px] font-semibold">{value}</span>
  </div>
);


const AvgBadge = ({ pct }: { pct: number }) => {
  const isUp = pct > 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[7.5px] font-bold px-1.5 py-0.5 rounded mt-1"
      style={isUp
        ? { background: "rgba(220,38,38,0.09)", color: "#dc2626" }
        : { background: "rgba(22,163,74,0.09)",  color: "#16a34a" }}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% trend
    </span>
  );
};

const KpiCell = ({ label, value, pct, last }: { label: string; value: string; pct?: number; last?: boolean }) => (
  <div className={`px-3 py-2 ${!last ? "border-r border-gray-100" : ""}`}>
    <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">{label}</div>
    <div className="text-[12px] font-semibold text-content mt-0.5">{value}</div>
    {pct !== undefined && <AvgBadge pct={pct} />}
  </div>
);

const CashierListMobile = ({ onBack, onSelectCashier }: Props) => {
  const dispatch = useAppDispatch();
  const lp = useAppSelector((state) => state.lossPrevention);
  const search = useAppSelector((state) => state.search);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const grades = useMemo(
    () => gradeAllCashiers(lp.transOverviews, lp.baselineOverviews, lp.cashiers, lp.selectedSaleType),
    [lp.transOverviews, lp.baselineOverviews, lp.cashiers, lp.selectedSaleType],
  );

  const noSale = lp.selectedSaleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

  const peerAvgs = grades.length > 0 ? {
    trans:     grades[0].trans.avg,
    qty:       grades[0].qty.avg,
    sales:     grades[0].sales.avg,
    avgTicket: grades[0].avgTicket.avg,
  } : null;

  const detail = lp.cashierDetails.find((d) => d.storeid === lp.selectedStoreId) ?? null;
  const trend  = lp.cashierTrends.find((t) => t.storeid === lp.selectedStoreId) ?? null;

  const trendPct = (current: number, trendVal: number, useAbs = false) => {
    const c = useAbs ? Math.abs(current) : current;
    const t = useAbs ? Math.abs(trendVal) : trendVal;
    return t !== 0 ? ((c - t) / t) * 100 : undefined;
  };

  const storeName = assignedStores.find((s) => s.storeid === lp.selectedStoreId)?.store_name ?? String(lp.selectedStoreId);

  const counts = useMemo(() => ({
    all:      grades.length,
    critical: grades.filter((g) => g.severity === "critical").length,
    watch:    grades.filter((g) => g.severity === "watch").length,
    healthy:  grades.filter((g) => g.severity === "ok").length,
  }), [grades]);

  const visible = useMemo(() => {
    if (sevFilter === "all") return grades;
    const mapped = sevFilter === "healthy" ? "ok" : sevFilter;
    return grades.filter((g) => g.severity === mapped);
  }, [grades, sevFilter]);

  const handleCashierClick = (cashier_number: number, store_number: string) => {
    dispatch(setSelectedCashier({ cashier_number, store_number }));
    onSelectCashier();
  };

  const stdCols = !noSale;

  return (
    <div className="flex flex-col h-full">
      {/* Header — matches Sales LedgerStoreReport nav */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-white/75 mt-0.5 flex-shrink-0">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <div className="text-white font-semibold text-[15px]">{storeName}</div>
          <div className="text-white/65 text-[11px]">{lp.selectedSaleType} Activity</div>
        </div>
      </div>

      {/* Totals strip */}
      <div className="flex-shrink-0 px-3 py-[9px] bg-gray-100 border-b border-gray-200 flex items-center">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">Store Totals</span>
      </div>
      <div className="flex-shrink-0 grid divide-x divide-gray-100 bg-white border-b border-gray-100"
        style={{ gridTemplateColumns: stdCols ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}
      >
        <KpiCell label="Trans"      value={detail ? detail.transaction_count.toLocaleString() : "—"}          pct={detail && trend ? trendPct(detail.transaction_count, trend.transaction_count) : undefined} />
        <KpiCell label="Items"      value={detail ? detail.total_items.toLocaleString() : "—"}                pct={detail && trend ? trendPct(detail.total_items, trend.total_items) : undefined} />
        {stdCols && <KpiCell label="Total"      value={detail ? formatCurrency2(detail.amount) : "—"}          pct={detail && trend ? trendPct(detail.amount, trend.amount, true) : undefined} />}
        {stdCols && <KpiCell label="Avg ticket" value={detail ? formatCurrency2(detail.average_dollars) : "—"} pct={detail && trend ? trendPct(detail.average_dollars, trend.average_dollars, true) : undefined} last />}

      </div>

      {/* Avg strip */}
      {peerAvgs && (
        <>
        <div className="flex-shrink-0 px-3 py-[9px] bg-gray-100 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">Cashier Averages</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1"><div className="w-[6px] h-[6px] rounded-[2px] bg-red-400 flex-shrink-0" /><span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">{noSale ? "0" : "0–1"}</span></div>
            <div className="flex items-center gap-1"><div className="w-[6px] h-[6px] rounded-[2px] bg-amber-400 flex-shrink-0" /><span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">1</span></div>
            <div className="flex items-center gap-1"><div className="w-[6px] h-[6px] rounded-[2px] bg-emerald-400 flex-shrink-0" /><span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">{noSale ? "2" : "3–4"}</span></div>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">below/at store avg</span>
          </div>
        </div>
        <div className={`flex-shrink-0 grid divide-x divide-gray-100 bg-white border-b border-gray-100`}
          style={{ gridTemplateColumns: stdCols ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}
        >
          <KpiCell label="Trans" value={Math.round(peerAvgs.trans).toLocaleString()} />
          <KpiCell label="Items" value={Math.round(peerAvgs.qty).toLocaleString()} />
          {stdCols && <KpiCell label="Total" value={formatCurrency2(Math.abs(peerAvgs.sales))} />}
          {stdCols && <KpiCell label="Avg ticket" value={formatCurrency2(Math.abs(peerAvgs.avgTicket))} last />}
        </div>
        </>
      )}

      <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

      {/* Cashier list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {lp.fetchingCashierTransactions && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading…</div>
        )}
        {!lp.fetchingCashierTransactions && visible.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No cashiers found.</div>
        )}
        {!lp.fetchingCashierTransactions && visible.map((g) => {
          const metrics = noSale
            ? [
                { label: "Trans", value: g.trans.value.toLocaleString(),               isPass: g.trans.isPass },
                { label: "Items",   value: g.qty.value.toLocaleString(),                 isPass: g.qty.isPass },
              ]
            : [
                { label: "Trans", value: g.trans.value.toLocaleString(),               isPass: g.trans.isPass },
                { label: "Items",   value: g.qty.value.toLocaleString(),                 isPass: g.qty.isPass },
                { label: "Total", value: formatCurrency2(Math.abs(g.sales.value)),     isPass: g.sales.isPass },
                { label: "Avg $", value: formatCurrency2(Math.abs(g.avgTicket.value)), isPass: g.avgTicket.isPass },
              ];

          return (
            <button
              key={`${g.cashier_number}-${g.store_number}`}
              onClick={() => handleCashierClick(g.cashier_number, g.store_number)}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <SevBadge sev={toSevBadge(g.severity)} />
                <div className="text-[13px] font-medium text-content truncate">{g.cashier_name} <span className="text-content/40 font-normal text-[11px]">#{g.cashier_number}</span></div>
              </div>
              <div className="flex items-center gap-1 flex-wrap pl-[30px]">
                {metrics.map(({ label, value, isPass }) => (
                  <MetricChip key={label} label={label} value={value} isPass={isPass} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CashierListMobile;
