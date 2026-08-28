import { useState } from "react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { CTA_SEVERITY_CLASSES } from "../../utils/severity";
import type { Severity } from "../../utils/severity";
import type { LpSeverity } from "./lpActionsMetrics";

/**
 * A conclusion, with the working behind it one click away.
 *
 * The app's CTA strip: severity fill and border, a bold label, and a `Why`
 * that drops the reasoning over whatever is underneath. Absolute, so nothing
 * below ever moves — a summary that shoves the content it explains down the
 * page makes the two impossible to read together.
 *
 * Used twice in LP Actions, for the same reason each time: the answer belongs
 * on the page and the argument belongs behind a click. The tone comes from the
 * verdict rather than being fixed, because both of these have to be able to
 * clear an operator as readily as accuse one.
 *
 * Open/closed stays local. It is not data, and a summary that reopened itself
 * on every revisit would be a nuisance rather than a memory.
 */
interface Props {
  tone: LpSeverity;
  /** Short and shouted, e.g. "Investigate". */
  label: string;
  /** Sits between the label and the toggle — a figure, usually. */
  trailing?: React.ReactNode;
  /** The reasoning. Rendered inside the drop-down. */
  children: React.ReactNode;
}

const TONE: Record<LpSeverity, Severity> = {
  investigate: "critical",
  watch: "watch",
  steady: "healthy",
};

const ICON: Record<LpSeverity, typeof ExclamationTriangleIcon> = {
  investigate: ExclamationTriangleIcon,
  watch: ExclamationCircleIcon,
  steady: CheckCircleIcon,
};

const CtaStrip = ({ tone, label, trailing, children }: Props) => {
  const [open, setOpen] = useState(false);
  const cls = CTA_SEVERITY_CLASSES[TONE[tone]];
  const Icon = ICON[tone];

  return (
    <div className={`relative flex-shrink-0 border-b ${cls.border} ${cls.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${cls.hoverBg}`}
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cls.text}`} />
        <span
          className={`text-[12px] font-bold uppercase tracking-wide ${cls.text}`}
        >
          {label}
        </span>
        {trailing && (
          <span className={`text-[12px] font-semibold ${cls.text}`}>
            {trailing}
          </span>
        )}
        <span className="flex-1" />
        <span className={`text-[12px] font-medium underline ${cls.text}`}>
          {open ? "Hide" : "Why"}
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-full left-0 right-0 z-30 px-4 py-2.5 border-b shadow-lg rounded-b-lg max-h-[340px] overflow-y-auto thin-scrollbar ${cls.bg} ${cls.border} ${cls.text}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CtaStrip;
