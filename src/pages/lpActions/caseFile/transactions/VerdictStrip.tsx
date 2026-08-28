import { useState } from "react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { CTA_SEVERITY_CLASSES } from "../../../../utils/severity";
import type { Severity } from "../../../../utils/severity";
import type { Verdict } from "./verdictModel";

/**
 * Whether this receipt supports the case, in the app's CTA strip.
 *
 * Closed by default, and it opens the way every other CTA strip does: a panel
 * anchored under the trigger, dismissed by clicking the label again. Absolute,
 * so the receipt underneath never moves — a summary that shoves the evidence
 * down the page makes the two impossible to read together.
 *
 * The tone is the verdict's, not a fixed red. The same strip has to be able to
 * clear an operator as readily as accuse one, and a green "Nothing unusual"
 * doing that is the half of the job that saves LP a trip.
 *
 * Open/closed stays local. It is not data, and a summary that reopened itself
 * every time a receipt was revisited would be a nuisance rather than a memory.
 */
interface Props {
  verdict: Verdict;
}

const TONE: Record<Verdict["tone"], Severity> = {
  investigate: "critical",
  watch: "watch",
  steady: "healthy",
};

const ICON = {
  investigate: ExclamationTriangleIcon,
  watch: ExclamationCircleIcon,
  steady: CheckCircleIcon,
};

const VerdictStrip = ({ verdict }: Props) => {
  const [open, setOpen] = useState(false);
  const tone = CTA_SEVERITY_CLASSES[TONE[verdict.tone]];
  const Icon = ICON[verdict.tone];

  return (
    <div className={`relative flex-shrink-0 border-b ${tone.border} ${tone.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center gap-1.5 px-4 py-2 text-left transition-colors ${tone.hoverBg}`}
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${tone.text}`} />
        <span
          className={`flex-1 text-[11px] font-bold uppercase tracking-wide ${tone.text}`}
        >
          {verdict.label}
        </span>
        <span className={`text-[11px] font-medium underline ${tone.text}`}>
          {open ? "Hide" : "Why"}
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-full left-0 right-0 z-30 px-4 py-2.5 border-b shadow-lg rounded-b-lg max-h-[340px] overflow-y-auto thin-scrollbar ${tone.bg} ${tone.border}`}
        >
          <ul className={`flex flex-col gap-1.5 ${tone.text}`}>
            {verdict.points.map((p) => (
              <li key={p} className="text-[12.5px] leading-relaxed pl-3 relative">
                <span className="absolute left-0 font-bold opacity-70">·</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VerdictStrip;
