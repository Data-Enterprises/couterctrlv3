import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { formatCurrencyCompact } from "../../utils";
import InfoButton from "../../components/InfoButton";
import InfoPopover from "../../components/InfoPopover";
import { SALES_TRACKER_INFO } from "./salesTrackerInfo";
import { signedPct } from "./trackerTone";

interface TrackerHeaderProps {
  windowLabel: string;
  scopeLabel: string;
  weeks: number;
  salesTy: number;
  pctChange: number | null;
  onOpenSearch: () => void;
}

/**
 * The tracker's left-panel header.
 *
 * Structurally the Sales ledger header — same navy block, same two rows, same
 * 22px bordered buttons and hairline divider — with the graded controls
 * removed. There is no threshold input and no Sales/Qty toggle because the
 * tracker grades nothing and reports dollars only; leaving either in place
 * would promise a behaviour the page does not have.
 */
const TrackerHeader = ({
  windowLabel,
  scopeLabel,
  weeks,
  salesTy,
  pctChange,
  onOpenSearch,
}: TrackerHeaderProps) => {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
      <div className="flex items-center gap-2 min-h-[26px]">
        <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
          {windowLabel}
        </span>
        <div className="flex-1" />
        <span className="text-[14px] font-semibold text-custom-white">
          {formatCurrencyCompact(salesTy)}
        </span>
        {pctChange !== null && (
          <span
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
              pctChange >= 0
                ? "bg-emerald-300/15 text-emerald-300"
                : "bg-red-300/15 text-red-300"
            }`}
          >
            LY {signedPct(pctChange)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
        <button
          onClick={onOpenSearch}
          className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          aria-label="Search stores"
        >
          <MagnifyingGlassIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

        <span className="text-[11px] text-custom-white font-medium truncate">
          {scopeLabel}
        </span>

        <div className="flex-1" />

        <span className="text-[11px] text-custom-white font-medium flex-shrink-0">
          {weeks} {weeks === 1 ? "week" : "weeks"}
        </span>

        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

        <div className="relative flex-shrink-0">
          <InfoButton onClick={() => setInfoOpen((prev) => !prev)} />
          {infoOpen && (
            <InfoPopover
              title={SALES_TRACKER_INFO.title}
              purpose={SALES_TRACKER_INFO.purpose}
              glossary={SALES_TRACKER_INFO.glossary}
              onClose={() => setInfoOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerHeader;
