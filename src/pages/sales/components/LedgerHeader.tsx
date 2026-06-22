import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setThreshold } from "../../../features/salesLedgerSlice";
import { formatCurrency2 } from "../../../utils";
import { formatPct } from "./tierColumnUtils";

interface LedgerHeaderProps {
  weekLabel: string;
  twTotal: number;
  vsLYPct: number;
  vsLWPct: number;
  hasLY: boolean;
  hasLW: boolean;
  onNewSearch: () => void;
}

const LedgerHeader = ({ weekLabel, twTotal, vsLYPct, vsLWPct, hasLY, hasLW, onNewSearch }: LedgerHeaderProps) => {
  const dispatch = useAppDispatch();
  const threshold = useAppSelector((s) => s.salesLedger.threshold);
  const [inputVal, setInputVal] = useState(String(threshold));

  return (
    <div className="bg-[#1e2a4a] rounded-t-xl px-4 py-2.5">
      {/* Top row: title + date | grading note | legend */}
      <div className="flex items-center gap-3 min-h-[24px]">
        <button
          onClick={onNewSearch}
          className="text-white font-medium text-[13px] hover:text-white/80 transition-colors text-left flex-shrink-0"
        >
          Weekly performance
        </button>
        <span className="text-white/35 text-[11px] flex-shrink-0">{weekLabel}</span>

        <div className="flex-1" />

        {/* Legend */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-[2px] bg-red-300 flex-shrink-0" />
            <span className="text-[10px] text-white/45">Critical &gt;{threshold}% down</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" />
            <span className="text-[10px] text-white/45">Watch 0–{threshold}% down</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-300 flex-shrink-0" />
            <span className="text-[10px] text-white/45">Healthy</span>
          </div>
        </div>
      </div>

      {/* Bottom row: metrics + threshold */}
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] text-white/45 uppercase tracking-wide">Net</span>
          <span className="text-[13px] font-medium text-white">{formatCurrency2(twTotal)}</span>
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

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-white/45 uppercase tracking-wide">Threshold</span>
          <input
            type="number"
            min={1}
            max={99}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 99) dispatch(setThreshold(v));
            }}
            onBlur={() => {
              const v = parseInt(inputVal, 10);
              if (isNaN(v) || v < 1 || v > 99) setInputVal(String(threshold));
            }}
            className="w-11 text-center text-[12px] font-medium bg-white/10 text-white rounded px-1.5 py-0.5 border border-white/20 focus:outline-none focus:border-white/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-white/45 uppercase tracking-wide">%</span>
        </div>
      </div>
    </div>
  );
};

export default LedgerHeader;
