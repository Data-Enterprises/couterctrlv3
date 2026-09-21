import InfoButton from "../../../../components-dev/InfoButton";
import { useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import {
  setThreshold,
  setGradingMetric,
  type GradingMetric,
} from "../../../../features/dev/devSalesLedgerSlice";
import { formatCurrencyCompact, formatBigNumber } from "../../../../utils";
import { formatPct } from "./tierColumnUtils";
import { headerDeltaPill } from "../../../../utils/severity";
import {
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import ThresholdFilter from "../../../../components-dev/filters/ThresholdFilter";
import ThresholdSlider from "../../../../components-dev/filters/ThresholdSlider";
import InfoPopover from "../../../../components-dev/InfoPopover";
import { SALES_LEDGER_INFO } from "../salesInfo";

const THRESHOLD_DEFAULT = 9;

interface LedgerHeaderProps {
  weekLabel: string;
  twTotal: number;
  twQty: number;
  vsLYPct: number;
  vsLWPct: number;
  hasLY: boolean;
  hasLW: boolean;
  /** Store-days in the result, and how many of them found a match. A pill over
   *  three days of a seven-day week is a hint, not a verdict, and this is what
   *  lets it be shown as one. */
  dayCount: number;
  lyDayCount: number;
  lwDayCount: number;
  /** More than one store in the result. The pills then state the group's
   *  figure without day counts — see headerDeltaPill. */
  isGroup: boolean;
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
  dayCount,
  lyDayCount,
  lwDayCount,
  isGroup,
  onOpenSearch,
  gradingMetric,
}: LedgerHeaderProps) => {
  const dispatch = useAppDispatch();
  const threshold = useAppSelector((s) => s.dev.salesLedger.threshold);
  const [infoOpen, setInfoOpen] = useState(false);

  const isQty = gradingMetric === "qty";

  // Clearing the numeric input dispatches null, and SalesLedger deliberately
  // keeps grading against the last valid amount so rows don't reshuffle. The
  // slider has to hold that same position or it would show a value nothing is
  // actually graded against.
  const lastValidRef = useRef<number>(threshold?.amount ?? THRESHOLD_DEFAULT);
  if (threshold?.amount != null) lastValidRef.current = threshold.amount;

  /**
   * A comparison missing days is not the same claim as a complete one.
   *
   * Store 590's last year has three of seven days, and the two it is missing
   * are Saturday and Sunday — the biggest of the week. The arithmetic over
   * those three days is correct and the conclusion still does not carry, so
   * the pill drops its red/green fill and says what it covers instead. Green
   * and red are for verdicts.
   */
  const lwPill = headerDeltaPill(vsLWPct, lwDayCount, dayCount, "last week", isGroup);
  const lyPill = headerDeltaPill(vsLYPct, lyDayCount, dayCount, "last year", isGroup);


  return (
    <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
      {/* Row 1: date | total + compact vs LW/LY pills.
          LW before LY, matching Sub Dept Margins and Vendors — and matching the
          column order in the list directly below this header, which has always
          been TY, vs LW, vs LY. The pills were the only place in the app
          reading the two periods the other way round. */}
      <div className="flex items-center gap-2 min-h-[26px]">
        <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
          {weekLabel}
        </span>
        <div className="flex-1" />
        <span className="text-[14px] font-semibold text-custom-white">
          {isQty ? formatBigNumber(twQty, 0) : formatCurrencyCompact(twTotal)}
        </span>
        {hasLW && (
          <span
            title={lwPill.title}
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${lwPill.cls}`}
          >
            LW {formatPct(vsLWPct)}
            {lwPill.note}
          </span>
        )}
        {hasLY && (
          <span
            title={lyPill.title}
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${lyPill.cls}`}
          >
            LY {formatPct(vsLYPct)}
            {lyPill.note}
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

        {/* Threshold — slider for exploring, numeric input for committing to
            an exact figure. Both write the same value; the slider is capped at
            a range that's meaningful for grading rather than 0-100. */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] text-custom-white font-medium">
            Store Threshold
          </span>
          <ThresholdSlider
            value={lastValidRef.current}
            onChange={(amount) =>
              dispatch(setThreshold({ op: threshold?.op ?? "gt", amount }))
            }
            variant="dark"
            ariaLabel="Store grading threshold, percent"
            className="w-[104px] flex-shrink-0"
          />
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

        {/* About this view */}
        <div className="relative flex-shrink-0">
          <InfoButton onClick={() => setInfoOpen((prev) => !prev)} />
          {infoOpen && (
            <InfoPopover
              title={SALES_LEDGER_INFO.title}
              purpose={SALES_LEDGER_INFO.purpose}
              glossary={SALES_LEDGER_INFO.glossary}
              onClose={() => setInfoOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerHeader;
