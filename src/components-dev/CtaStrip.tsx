import { useState, type ReactNode } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";

/**
 * The house CTA strip: a one-line verdict you can open for the working
 * behind it.
 *
 * Three rules, and all three are the point of it:
 *
 * **Closed by default.** The label already carries the finding. The sentence
 * underneath is why, and nobody needs why until they disagree with what.
 *
 * **The detail lays OVER what is below it**, never pushes it down. A strip
 * that reflows the panel moves the thing the reader was about to click out
 * from under their cursor, so opening it costs them their place.
 *
 * **The strip owns its own colour.** Callers hand it the four classes —
 * `CTA_SEVERITY_CLASSES[sev]` where there is a grade, delta tokens where the
 * question is direction rather than grade.
 *
 * Written as one component because it had been written four times: the Sub
 * dept tab, Hourly, Top 200 and the share rail each carried their own copy,
 * and they had already drifted on which chevron, which z-index and whether
 * the thing started open.
 */

export interface CtaTone {
  border: string;
  bg: string;
  hoverBg: string;
  text: string;
}

interface Props {
  tone: CtaTone;
  /** Sits at the head of the strip. Null for a strip with no icon. */
  icon?: ReactNode;
  /** The finding, in a few words. Truncates — the detail is where the room
   *  is. */
  label: ReactNode;
  /** The word for what it is, pinned to the right of the label and never
   *  truncated: Falling, Critical, Outpaced. */
  trailing?: ReactNode;
  /** The working behind the label. */
  detail: ReactNode;
  /** Open on mount. Off, and a caller wanting it on should be able to say
   *  why — see the rules above. */
  defaultOpen?: boolean;
  className?: string;
}

const CtaStrip = ({
  tone,
  icon,
  label,
  trailing,
  detail,
  defaultOpen = false,
  className = "",
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`relative flex-shrink-0 border-b ${tone.border} ${className}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 ${tone.bg} ${tone.hoverBg} transition-colors`}
      >
        {icon}
        <span className={`text-[12px] font-semibold truncate ${tone.text}`}>
          {label}
        </span>
        {trailing && (
          <span
            className={`text-[12px] font-semibold flex-shrink-0 ${tone.text}`}
          >
            {trailing}
          </span>
        )}
        <span className="flex-1" />
        {open ? (
          <ChevronUpIcon className={`w-3 h-3 flex-shrink-0 ${tone.text}`} />
        ) : (
          <ChevronDownIcon className={`w-3 h-3 flex-shrink-0 ${tone.text}`} />
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 right-0 z-20 px-3 py-2 border-b shadow-lg ${tone.bg} ${tone.border}`}
        >
          <span className={`text-[12.5px] leading-relaxed ${tone.text}`}>
            {detail}
          </span>
        </div>
      )}
    </div>
  );
};

export default CtaStrip;
