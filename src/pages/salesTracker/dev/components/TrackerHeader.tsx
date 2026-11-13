// Utils
import { formatCurrencyCompact } from "../../../../utils";
import { signedPct } from "../utils/trackerTone";

// Interfaces
import type { TrackerBasis } from "../interfaces";

// Components
import BackButton from "../../../../components-dev/BackButton";
import {
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import ComingSoonHelp from "../../../../components-dev/ComingSoonHelp";

interface TrackerHeaderProps {
  /** What the comparison figures are measured against. */
  basis: TrackerBasis;
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
 * The tracker's left-panel header: the Sales ledger header's structure, without
 * the graded controls (no threshold, no Sales/Qty toggle; dollars only).
 */
const TrackerHeader = ({
  basis,
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

  return (
    <div className="cc-navy-panel-header flex flex-col gap-0">
      <div className="flex items-center gap-2 min-h-[26px]">
        <span className="cc-navy-title text-[13px] flex-shrink-0">
          {windowLabel}
        </span>
        <div className="flex-1" />
        <span className="text-[14px] cc-navy-title">
          {formatCurrencyCompact(salesTy)}
        </span>
        <div className="relative flex-shrink-0">
          <PageInfoButton page="sales-tracker" />
        </div>
        {pctChange !== null && (
          <span
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
              pctChange >= 0
                ? "bg-emerald-300/15 text-emerald-300"
                : "bg-red-300/15 text-red-300"
            }`}
          >
            {basis} {signedPct(pctChange)}
          </span>
        )}
      </div>

      <div
        data-help="scope"
        className="flex items-center gap-2 cc-navy-header-row"
      >
        <BackButton onClick={onOpenSearch} />

        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

        <span className="text-[11px] text-custom-white font-medium truncate">
          {scopeLabel}
        </span>

        <div className="flex-1" />

        {/* The window and its two controls: minus narrows it (rows are kept),
            plus fetches only the week added. */}
        <div data-help="window" className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onDropWeek}
            disabled={!canDropWeek}
            aria-label="Remove the oldest week"
            title="Remove the oldest week"
            className="flex h-5 w-5 items-center justify-center rounded border border-custom-white/20 text-custom-white/95 hover:bg-custom-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
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
            className="flex h-5 w-5 items-center justify-center rounded border border-custom-white/20 text-custom-white/95 hover:bg-custom-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>

        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

        <div className="relative flex-shrink-0">
          <ComingSoonHelp />
        </div>
      </div>
    </div>
  );
};

export default TrackerHeader;
