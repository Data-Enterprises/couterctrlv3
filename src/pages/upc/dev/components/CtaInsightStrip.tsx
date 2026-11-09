// Hooks
import { useState } from "react";

// Utils
import { TONE_CLASSES } from "../utils";

// Interfaces
import type { CtaTone } from "../interfaces";

// Components
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid";

interface CtaInsightStripProps {
  title: string;
  insight: React.ReactNode;
  tone: CtaTone;
}

/** A clickable, tone-coloured insight strip that expands into a plain-language
 *  explanation; it flags direction (up/down/flat), it doesn't grade. */
const CtaInsightStrip = ({ title, insight, tone }: CtaInsightStripProps) => {
  const [open, setOpen] = useState(false);
  const c = TONE_CLASSES[tone];

  return (
    <div className={`relative border-b ${c.border}`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center gap-1.5 px-4 py-2 ${c.bg} ${c.hoverBg} transition-colors`}
      >
        {tone === "down" && (
          <ExclamationTriangleIcon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />
        )}
        {tone === "up" && <CheckCircleIcon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />}
        {(tone === "flat" || tone === "muted") && (
          <MinusCircleIcon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />
        )}
        <span className={`text-[12px] font-semibold truncate ${c.text}`}>{title}</span>
        <span className={`text-[12px] font-semibold flex-shrink-0 ${c.text}`}>Insight</span>
        <span className="flex-1" />
        {open ? (
          <ChevronUpIcon className={`w-3 h-3 flex-shrink-0 ${c.text}`} />
        ) : (
          <ChevronDownIcon className={`w-3 h-3 flex-shrink-0 ${c.text}`} />
        )}
      </button>
      {open && (
        <div className={`absolute top-full left-0 right-0 z-20 px-4 py-2.5 border-b shadow-lg ${c.bg} ${c.border}`}>
          <div className={`text-[12px] leading-relaxed ${c.text}`}>{insight}</div>
        </div>
      )}
    </div>
  );
};

export default CtaInsightStrip;
