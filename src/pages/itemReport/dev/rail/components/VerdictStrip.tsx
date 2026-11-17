// Utils
import { ACTION_LABEL } from "../../utils/verdict";
import { ACTION_TONE } from "../../utils/actionTone";

// Interfaces
import type { Dispatch, SetStateAction } from "react";
import type { ActionKind } from "../../interfaces";

// Components
import DetailPopover from "../../components/DetailPopover";

interface VerdictStripProps {
  action: ActionKind;
  evidence: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * The conclusion, before any of the figures behind it — the order the UPC
 * Workbook's detail panels use.
 *
 * Built on `ACTION_TONE` rather than the shared `CtaInsightStrip`: that
 * component's vocabulary is direction (up / down / flat), and six actions
 * can't map onto three without collapsing the blue and violet distinctions the
 * chips already carry.
 *
 * Closed by default, and it opens the way the "?" does — anchored under its
 * own trigger, dismissed by a click anywhere outside. The label alone answers
 * "what do I do"; the sentence is the working behind it.
 */
const VerdictStrip = ({
  action,
  evidence,
  open,
  setOpen,
}: VerdictStripProps) => (
  <div
    data-help="verdict"
    className={`relative flex-shrink-0 border-b border-brand_navy/15 ${ACTION_TONE[action].row}`}
  >
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-2"
    >
      <span
        className={`text-[11px] font-bold uppercase tracking-wide ${ACTION_TONE[action].text}`}
      >
        {ACTION_LABEL[action]}
      </span>
      <span
        className={`text-[11px] font-medium underline ${ACTION_TONE[action].text}`}
      >
        {open ? "Hide" : "Why"}
      </span>
    </button>
    <DetailPopover
      open={open}
      onClose={() => setOpen(false)}
      className={`${ACTION_TONE[action].row} ${ACTION_TONE[action].text}`}
    >
      <div className="px-4 py-2.5 text-[13px] leading-relaxed">{evidence}</div>
    </DetailPopover>
  </div>
);

export default VerdictStrip;
