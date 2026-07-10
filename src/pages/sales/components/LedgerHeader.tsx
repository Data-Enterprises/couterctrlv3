import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setThreshold,
  setGradingMetric,
  type GradingMetric,
} from "../../../features/salesLedgerSlice";
import { formatCurrencyCompact, formatBigNumber } from "../../../utils";
import { formatPct } from "./tierColumnUtils";
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
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

const LedgerHeader = ({
  weekLabel,
  twTotal,
  twQty,
  vsLYPct,
  vsLWPct,
  hasLY,
  hasLW,
  onOpenSearch,
  gradingMetric,
}: LedgerHeaderProps) => {
  const dispatch = useAppDispatch();
  const threshold = useAppSelector((s) => s.salesLedger.threshold);
  const [legendHover, setLegendHover] = useState(false);

  const isQty = gradingMetric === "qty";

  return (
    <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
      {/* Row 1: date | total + compact vs LY/LW pills */}
      <div className="flex items-center gap-2 min-h-[26px]">
        <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
          {weekLabel}
        </span>
        <div className="flex-1" />
        <span className="text-[14px] font-semibold text-custom-white">
          {isQty ? formatBigNumber(twQty, 0) : formatCurrencyCompact(twTotal)}
        </span>
        {hasLY && (
          <span
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
              vsLYPct >= 0 ? "bg-emerald-300/15 text-emerald-300" : "bg-red-300/15 text-red-300"
            }`}
          >
            LY {formatPct(vsLYPct)}
          </span>
        )}
        {hasLW && (
          <span
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
              vsLWPct >= 0 ? "bg-emerald-300/15 text-emerald-300" : "bg-red-300/15 text-red-300"
            }`}
          >
            LW {formatPct(vsLWPct)}
          </span>
        )}
      </div>

      {/* Row 2: search + toggle left | threshold + legend right */}
      <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          aria-label="Search stores"
        >
          <MagnifyingGlassIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

        {/* Grading metric toggle */}
        <div
          className="flex items-center flex-shrink-0 rounded overflow-hidden"
          style={{ height: 22 }}
        >
          {(["sales", "qty"] as GradingMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => dispatch(setGradingMetric(m))}
              className="px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full capitalize"
              style={{
                background:
                  gradingMetric === m
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.07)",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Threshold */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] text-custom-white font-medium">
            Store Threshold
          </span>
          <ThresholdFilter
            value={threshold}
            onChange={(v) => dispatch(setThreshold(v))}
            suffix="%"
            showOp={false}
            inputWidth={40}
            variant="dark"
          />
        </div>

        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

        {/* Legend tooltip */}
        <div
          className="relative flex-shrink-0"
          onMouseEnter={() => setLegendHover(true)}
          onMouseLeave={() => setLegendHover(false)}
        >
          <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40 transition-colors">
            <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
          </button>
          {legendHover && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-custom-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-1.5"
              style={{ minWidth: 210 }}
            >
              {[
                {
                  color: "#fca5a5",
                  label: threshold
                    ? `Critical — >${threshold.amount}% below LY`
                    : "Critical",
                },
                {
                  color: "#fcd34d",
                  label: threshold
                    ? `Watch — 0–${threshold.amount}% below LY`
                    : "Watch",
                },
                { color: "#6ee7b7", label: "Healthy — at or above LY" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-start gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0 mt-[3px]"
                    style={{ background: color }}
                  />
                  <div className="text-[12px] flex justify-between flex-1 text-custom-white">
                    <div>{label.split("—")[0]}</div>
                    <div>{label.split("—")[1]}</div>
                  </div>
                </div>
              ))}
              <div className="h-px bg-custom-white/10 my-0.5" />
              <div className="text-[11px] font-semibold uppercase tracking-wide text-custom-white">
                Metric graded
              </div>
              {[
                { label: "Sales", active: !isQty },
                { label: "Quantity", active: isQty },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-custom-white text-[11px]">·</span>
                  <span className="text-[12px] text-custom-white">{label}</span>
                  {active && (
                    <span className="text-[11.5px] text-custom-white font-medium">
                      selected
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerHeader;
