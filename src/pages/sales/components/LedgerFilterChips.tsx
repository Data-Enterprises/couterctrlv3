import { ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";

export type FilterMode = "all" | "critical" | "attention" | "above";

interface LedgerFilterChipsProps {
  filter: FilterMode;
  totalCount: number;
  criticalCount: number;
  attentionCount: number;
  onChange: (f: FilterMode) => void;
}

const chips: {
  key: FilterMode;
  label: (total: number, critical: number, attn: number) => string;
  icon: ReactNode;
  activeClass: string;
}[] = [
  {
    key: "all",
    label: (total) => `All (${total})`,
    icon: <Squares2X2Icon className="w-3.5 h-3.5" />,
    activeClass: "bg-[#3b82f6] text-white border-[#3b82f6]",
  },
  {
    key: "critical",
    label: (_, critical) => `Critical (${critical})`,
    icon: <ExclamationTriangleIcon className="w-3.5 h-3.5" />,
    activeClass: "bg-red-600 text-white border-red-600",
  },
  {
    key: "attention",
    label: (_, _c, attn) => `Watch (${attn})`,
    icon: <ExclamationCircleIcon className="w-3.5 h-3.5" />,
    activeClass: "bg-amber-500 text-white border-amber-500",
  },
  {
    key: "above",
    label: () => "Healthy",
    icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
    activeClass: "bg-emerald-600 text-white border-emerald-600",
  },
];

const LedgerFilterChips = ({
  filter,
  totalCount,
  criticalCount,
  attentionCount,
  onChange,
}: LedgerFilterChipsProps) => {
  return (
    <div className="flex gap-2 mb-3">
      {chips.map(({ key, label, icon, activeClass }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filter === key
              ? activeClass
              : "bg-custom-white text-content border-gray-200 hover:border-gray-400"
          }`}
        >
          {icon}
          {label(totalCount, criticalCount, attentionCount)}
        </button>
      ))}
    </div>
  );
};

export default LedgerFilterChips;
