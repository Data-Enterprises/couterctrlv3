import { useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid";

export type CtaTone = "up" | "down" | "flat" | "muted";

interface Props {
  title: string;
  insight: React.ReactNode;
  tone: CtaTone;
}

const TONE_CLASSES: Record<CtaTone, { bg: string; hoverBg: string; text: string; border: string }> = {
  up: {
    bg: "bg-severity_healthy_bg",
    hoverBg: "hover:bg-severity_healthy_text/10",
    text: "text-severity_healthy_text",
    border: "border-severity_healthy_text/25",
  },
  down: {
    bg: "bg-severity_critical_bg",
    hoverBg: "hover:bg-severity_critical_text/10",
    text: "text-severity_critical_text",
    border: "border-severity_critical_text/25",
  },
  flat: {
    bg: "bg-gray-100",
    hoverBg: "hover:bg-gray-200",
    text: "text-content",
    border: "border-gray-300",
  },
  muted: {
    bg: "bg-gray-100",
    hoverBg: "hover:bg-gray-200",
    text: "text-content",
    border: "border-gray-300",
  },
};

// Clickable, tone-colored insight strip that replaces a plain title with an
// expandable plain-language explanation. Mirrors Sales' CTA_SEVERITY_CLASSES
// / getCta pattern (PopupSubDeptList.tsx), remapped to a tone (up/down/flat)
// instead of a 3-tier critical/watch/healthy grade — diagnostic modules
// don't grade, they flag direction. Shared so any UPC module's future
// detail panel can reuse it with its own title/insight/tone.
const CtaInsightStrip = ({ title, insight, tone }: Props) => {
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
