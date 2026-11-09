// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { getStatusPhrase, TONE_TEXT } from "../utils";

// Interfaces
import type { UpcSalesCompStats } from "../interfaces";

interface SalesCompLeftListProps {
  stats: UpcSalesCompStats[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

/** The Sales Comp tab's left list: one row per item with its period total, code and a
 *  status phrase vs last year. */
const SalesCompLeftList = ({ stats, selectedCode, onSelect }: SalesCompLeftListProps) => {
  return (
    <div className="w-[340px] flex-shrink-0 border-r border-gray-100 overflow-y-auto thin-scrollbar">
      {stats.map((s) => {
        const phrase = getStatusPhrase(s.vsLYPct, s.wowPct);
        const isSelected = s.code === selectedCode;
        return (
          <button
            key={s.code}
            onClick={() => onSelect(s.code)}
            className={`w-full text-left px-2.5 py-2 border-b border-gray-50 transition-colors ${
              isSelected ? "bg-custom-white" : "hover:bg-gray-50"
            }`}
            style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-content truncate">{s.desc}</span>
              <span className="text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
                {formatCurrency2(s.periodTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 font-medium">
              <span className="text-[11px] text-content/85 truncate">{s.code}</span>
              <span className={`text-[11px] flex-shrink-0 ${TONE_TEXT[phrase.tone]}`}>
                {phrase.text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SalesCompLeftList;
