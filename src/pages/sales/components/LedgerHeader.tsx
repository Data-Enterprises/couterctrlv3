import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setThreshold, setGradingMetric, type GradingMetric } from "../../../features/salesLedgerSlice";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import { formatPct } from "./tierColumnUtils";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";

interface LedgerHeaderProps {
  weekLabel: string;
  twTotal: number;
  twQty: number;
  vsLYPct: number;
  vsLWPct: number;
  hasLY: boolean;
  hasLW: boolean;
  onNewSearch: () => void;
  onOpenSearch: () => void;
  gradingMetric: GradingMetric;
}

const LedgerHeader = ({ weekLabel, twTotal, twQty, vsLYPct, vsLWPct, hasLY, hasLW, onNewSearch: _onNewSearch, onOpenSearch, gradingMetric }: LedgerHeaderProps) => {
  const dispatch = useAppDispatch();
  const threshold = useAppSelector((s) => s.salesLedger.threshold);

  const isQty = gradingMetric === "qty";

  return (
    <div className="bg-[#1e2a4a] rounded-t-xl px-4 py-2.5">
      {/* Row 1: title + date | grading toggle + threshold */}
      <div className="flex items-center gap-3 min-h-[24px]">
        <button
          onClick={onOpenSearch}
          className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
          aria-label="New search"
        >
          <MagnifyingGlassIcon className="w-3.5 h-3.5" />
        </button>
        <span className="text-white font-medium text-[13px] flex-shrink-0">Weekly performance</span>
        <span className="text-white/35 text-[11px] flex-shrink-0">{weekLabel}</span>

        <div className="flex-1" />

        {/* Grading metric toggle */}
        <div className="flex items-center flex-shrink-0 rounded overflow-hidden" style={{ height: 22 }}>
          {(["sales", "qty"] as GradingMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => dispatch(setGradingMetric(m))}
              className="px-2.5 text-[10px] font-medium transition-colors h-full capitalize"
              style={{
                background: gradingMetric === m ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
                color: gradingMetric === m ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Threshold */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-white/45 uppercase tracking-wide">Threshold</span>
          <ThresholdFilter
            value={threshold}
            onChange={(v) => dispatch(setThreshold(v))}
            suffix="%"
            showOp={false}
            inputWidth={40}
            variant="dark"
          />
        </div>
      </div>

      {/* Row 2: grade metrics + legend */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] text-white/45 uppercase tracking-wide">{isQty ? "Units" : "Net"}</span>
          <span className="text-[13px] font-medium text-white">
            {isQty ? formatBigNumber(twQty, 0) : formatCurrency2(twTotal)}
          </span>
        </div>
        {hasLY && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-white/45 uppercase tracking-wide">vs LY</span>
            <span className={`text-[13px] font-medium ${vsLYPct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {formatPct(vsLYPct)}
            </span>
          </div>
        )}
        {hasLW && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-white/45 uppercase tracking-wide">vs LW</span>
            <span className={`text-[13px] font-medium ${vsLWPct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {formatPct(vsLWPct)}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Legend */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-[2px] bg-red-300 flex-shrink-0" />
            <span className="text-[9px] text-white/35">{threshold ? `Critical >${threshold.amount}% down` : "Critical"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" />
            <span className="text-[9px] text-white/35">{threshold ? `Watch 0–${threshold.amount}% down` : "Watch"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-300 flex-shrink-0" />
            <span className="text-[9px] text-white/35">Healthy</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LedgerHeader;
