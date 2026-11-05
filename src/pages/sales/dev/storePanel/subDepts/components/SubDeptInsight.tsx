// Utils
import { ctaClasses } from "../utils";

// Interfaces
import type { DeptCta } from "../interfaces";

// Components
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";

interface SubDeptInsightProps {
  name: string;
  cta: DeptCta;
  open: boolean;
  onToggle: () => void;
}

/** The open sub department's name, coloured by its grade; a click shows the
 *  insight line under it. */
const SubDeptInsight = ({ name, cta, open, onToggle }: SubDeptInsightProps) => {
  const c = ctaClasses(cta.severity);
  return (
    <div className={`relative border-b ${c.border}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 ${c.bg} ${c.hoverBg} transition-colors`}
      >
        {cta.severity === "critical" && (
          <ExclamationTriangleIcon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />
        )}
        {cta.severity === "watch" && (
          <ExclamationCircleIcon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />
        )}
        {cta.severity === "healthy" && (
          <CheckCircleIcon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />
        )}
        <span className={`text-[12px] font-semibold truncate ${c.text}`}>{name}</span>
        <span className={`text-[12px] font-semibold flex-shrink-0 ${c.text}`}>Insight</span>
        <span className="flex-1" />
        {open ? (
          <ChevronUpIcon className={`w-3 h-3 flex-shrink-0 ${c.text}`} />
        ) : (
          <ChevronDownIcon className={`w-3 h-3 flex-shrink-0 ${c.text}`} />
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 right-0 z-20 px-3 py-2 border-b shadow-lg ${c.bg} ${c.border}`}
        >
          <span className={`text-[11px] leading-relaxed ${c.text}`}>{cta.text}</span>
        </div>
      )}
    </div>
  );
};

export default SubDeptInsight;
