import { useState } from "react";
import {
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { formatCurrencyCompact } from "../../../utils";
import InfoButton from "../../../components-dev/InfoButton";
import InfoPopover from "../../../components-dev/InfoPopover";
import { SALES_TRACKER_INFO } from "./salesTrackerInfo";
import { signedPct } from "./trackerTone";

interface TrackerHeaderProps {
  windowLabel: string;
  scopeLabel: string;
  weeks: number;
  addingWeek: boolean;
  canAddWeek: boolean;
  canDropWeek: boolean;
  onAddWeek: () => void;
  onDropWeek: () => void;
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
  addingWeek,
  canAddWeek,
  canDropWeek,
  onAddWeek,
  onDropWeek,
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

        {/* The window, and the two controls that change it.
            Minus is free — the rows stay held and the window simply narrows,
            so a week that comes back off a later plus costs no request. Plus
            fetches only the week being added. */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onDropWeek}
            disabled={!canDropWeek}
            aria-label="Remove the oldest week"
            title="Remove the oldest week"
            className="flex h-5 w-5 items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:bg-custom-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <MinusIcon className="h-3 w-3" />
          </button>
          <span className="text-[11px] text-custom-white font-medium tabular-nums min-w-[52px] text-center">
            {addingWeek
              ? "loading…"
              : `${weeks} ${weeks === 1 ? "week" : "weeks"}`}
          </span>
          <button
            type="button"
            onClick={onAddWeek}
            disabled={!canAddWeek || addingWeek}
            aria-label="Add another week"
            title="Add another week further back"
            className="flex h-5 w-5 items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:bg-custom-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>

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
