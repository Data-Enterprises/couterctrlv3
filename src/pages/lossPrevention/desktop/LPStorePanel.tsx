import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, formatBigNumber, getStoreName } from "../../../utils";
import { useAppSelector } from "../../../hooks";
import type { CashierDetails } from "../../../interfaces";
import type { Severity, SevFilter } from "../../../utils/severity";
import { severityDotClass, formatPct } from "../../../utils/severity";
import { isNoDollarType, storeSeverity, directionalPillClass } from "../gradingUtils";
import TextFilter from "../../../components/filters/TextFilter";

const SEV_RANK: Record<Severity, number> = { critical: 0, watch: 1, healthy: 2 };

interface Props {
  loading: boolean;
  onSaleTypeSelect: (saleType: string) => void;
  onStoreSelect: (detail: CashierDetails) => void;
  onOpenSearch: () => void;
}

const LPStorePanel = ({ loading, onSaleTypeSelect, onStoreSelect, onOpenSearch }: Props) => {
  const cashier = useAppSelector((s) => s.lossPrevention);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const [legendHover, setLegendHover] = useState(false);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");

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

  const hasAmount = !isNoDollarType(selectedSaleType);

  const graded = useMemo(
    () =>
      cashierDetails.map((detail) => {
        const b = baselineDetails.find((x) => x.storeid === detail.storeid);
        const bTrans = b ? b.transaction_count / 2 : null;
        const bItems = b ? b.total_items / 2 : null;
        const bAmount = b ? Math.abs(b.amount) / 2 : null;
        const bAvg = b ? Math.abs(b.average_dollars) : null;
        const transPct =
          bTrans !== null && bTrans !== 0
            ? ((detail.transaction_count - bTrans) / Math.abs(bTrans)) * 100
            : null;
        const itemsPct =
          bItems !== null && bItems !== 0
            ? ((detail.total_items - bItems) / Math.abs(bItems)) * 100
            : null;
        const amountPct =
          bAmount !== null && bAmount !== 0
            ? ((Math.abs(detail.amount) - bAmount) / bAmount) * 100
            : null;
        const avgPct =
          bAvg !== null && bAvg !== 0
            ? ((Math.abs(detail.average_dollars) - bAvg) / bAvg) * 100
            : null;
        return {
          detail,
          name: getStoreName(assignedStores, detail.storeid, detail.store_name),
          sev: storeSeverity(detail, baselineDetails, selectedSaleType),
          transPct,
          itemsPct,
          amountPct,
          avgPct,
        };
      }),
    [cashierDetails, baselineDetails, selectedSaleType, assignedStores],
  );

  const criticalCount = graded.filter((g) => g.sev === "critical").length;
  const watchCount = graded.filter((g) => g.sev === "watch").length;
  const healthyCount = graded.filter((g) => g.sev === "healthy").length;

  const sevFilteredStores =
    sevFilter === "all" ? graded : graded.filter((g) => g.sev === sevFilter);

  const textFilteredStores = storeFilter
    ? sevFilteredStores.filter((g) =>
        g.name.toLowerCase().includes(storeFilter.toLowerCase()),
      )
    : sevFilteredStores;

  const visibleStores = [...textFilteredStores].sort(
    (a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev],
  );

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ width: "39%", flexShrink: 0 }}>
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0" style={{ background: "#1e2a4a" }}>
        {/* Row 1: date | totals */}
        <div className="flex items-center gap-2 min-h-[24px]">
          <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">{dateLabel}</span>
          <div className="flex-1" />
          {cashierDetails.length > 0 && (
            <>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-custom-white/45">Sales</span>
                <span className="text-[13px] font-medium text-custom-white">{formatCurrency2(totalSales)}</span>
              </div>
              <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-custom-white/45">Trans</span>
                <span className="text-[13px] font-medium text-custom-white">{formatBigNumber(totalTrans, 0)}</span>
              </div>
              <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-custom-white/45">Items</span>
                <span className="text-[13px] font-medium text-custom-white">{formatBigNumber(totalItems, 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* Row 2: search left | legend right */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            aria-label="Search stores"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1" />
          <span className="text-[9px] font-medium uppercase tracking-wide text-custom-white/35 flex-shrink-0">Exception activity vs baseline</span>
          <div className="relative flex-shrink-0" onMouseEnter={() => setLegendHover(true)} onMouseLeave={() => setLegendHover(false)}>
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/50 hover:text-custom-white hover:border-custom-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-custom-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-1.5" style={{ minWidth: 230 }}>
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
                    <span className="text-[11px] text-custom-white/90 leading-snug">{label}</span>
                  </div>
                ))}
                <div className="h-px bg-custom-white/10 my-0.5" />
                <div className="text-[9px] text-custom-white/50 leading-snug">Baseline = avg per week over the prior 2 weeks</div>
                <div className="h-px bg-custom-white/10 my-0.5" />
                <div className="text-[9px] font-semibold uppercase tracking-wide text-custom-white/35">Metrics graded</div>
                <div className="flex flex-col gap-1">
                  {(isNoDollarType(selectedSaleType) ? [
                    "Transaction count", "Total items",
                  ] : [
                    "Transaction count", "Total items", "Exception amount", "Average dollars",
                  ]).map((m) => (
                    <div key={m} className="flex items-center gap-1.5">
                      <span className="text-custom-white/30 text-[10px]">·</span>
                      <span className="text-[10px] text-custom-white/90">{m}</span>
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
            className={`flex-1 text-center px-2 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              selectedSaleType === st.sale_type
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
          >
            {st.sale_type}
          </button>
        ))}
      </div>

      {/* Severity filter chips + text filter */}
      <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-custom-white border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
              sevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
            }`}
          >
            Crit ({criticalCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "watch" ? "all" : "watch"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
              sevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
            }`}
          >
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
              sevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
            }`}
          >
            OK ({healthyCount})
          </button>
        </div>
        <TextFilter
          value={storeFilter}
          onChange={setStoreFilter}
          placeholder="Filter by store…"
          className="max-w-[180px]"
        />
      </div>

      {/* Unified store list — sorted critical → watch → healthy */}
      <div className="flex-1 min-h-0 flex flex-col">
        {loading && cashierDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">Loading…</div>
        ) : cashierDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">
            {selectedSaleType ? "No stores found" : "Select an exception type"}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
              <span className="w-2.5 flex-shrink-0" />
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
                Store
              </span>
              <div className="flex items-center gap-[14px]">
                {hasAmount && (
                  <span
                    className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 pl-2.5 text-center"
                    style={{ width: 64 }}
                  >
                    Total
                  </span>
                )}
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 text-center"
                  style={{ width: 58 }}
                >
                  Trans
                </span>
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 text-center"
                  style={{ width: 58 }}
                >
                  Items
                </span>
                {hasAmount && (
                  <span
                    className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0 text-center"
                    style={{ width: 58 }}
                  >
                    Avg $
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {visibleStores.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                  No stores match
                </div>
              ) : (
                visibleStores.map(({ detail, name, sev, transPct, itemsPct, amountPct, avgPct }) => {
                  const isSel = detail.storeid === selectedStoreId;
                  return (
                    <button
                      key={detail.storeid}
                      onClick={() => onStoreSelect(detail)}
                      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                        isSel
                          ? "bg-row_selected border-row_selected_border"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[sev]}`} />
                      <span className="text-[13px] font-medium text-content truncate flex-1">
                        {name}
                      </span>
                      <div className="flex items-center gap-[14px]">
                        {hasAmount && (
                          <span
                            className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
                              amountPct === null ? "bg-gray-100 text-gray-400" : directionalPillClass(amountPct)
                            }`}
                            style={{ width: 64 }}
                          >
                            {formatCurrency2(Math.abs(detail.amount))}
                          </span>
                        )}
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
                            transPct === null ? "bg-gray-100 text-gray-400" : directionalPillClass(transPct)
                          }`}
                          style={{ width: 58 }}
                        >
                          {transPct === null ? "—" : formatPct(transPct)}
                        </span>
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
                            itemsPct === null ? "bg-gray-100 text-gray-400" : directionalPillClass(itemsPct)
                          }`}
                          style={{ width: 58 }}
                        >
                          {itemsPct === null ? "—" : formatPct(itemsPct)}
                        </span>
                        {hasAmount && (
                          <span
                            className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
                              avgPct === null ? "bg-gray-100 text-gray-400" : directionalPillClass(avgPct)
                            }`}
                            style={{ width: 58 }}
                          >
                            {avgPct === null ? "—" : formatPct(avgPct)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LPStorePanel;
