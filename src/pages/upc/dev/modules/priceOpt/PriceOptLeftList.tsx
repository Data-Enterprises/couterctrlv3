import { formatCurrency2 } from "../../../../../utils";
import type { PriceOptRowSummary } from "./priceOptStats";
import { getPriceOptPhrase, type PriceOptTone } from "./priceOptPhrase";

interface Props {
  rows: PriceOptRowSummary[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

const TONE_TEXT: Record<PriceOptTone, string> = {
  up: "text-severity_healthy_text",
  down: "text-severity_critical_text",
  flat: "text-content/85",
  muted: "text-content/85",
};

// Headline is always Best price — there's no current price anywhere in this
// data for it to compete with, so every row reads the same regardless of
// order clicked.
const PriceOptLeftList = ({ rows, selectedCode, onSelect }: Props) => {
  return (
    <div className="w-[340px] flex-shrink-0 border-r border-gray-100 overflow-y-auto thin-scrollbar">
      {rows.map((r) => {
        const phrase = getPriceOptPhrase(r.points, r.elasticity);
        const isSelected = r.code === selectedCode;
        return (
          <button
            key={r.code}
            onClick={() => onSelect(r.code)}
            className={`w-full text-left px-2.5 py-2 border-b border-gray-50 transition-colors ${
              isSelected ? "bg-custom-white" : "hover:bg-gray-50"
            }`}
            style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-content truncate">{r.desc}</span>
              <span className="text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
                {formatCurrency2(r.bestPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 font-medium">
              <span className="text-[11px] text-content/85 truncate">{r.code}</span>
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

export default PriceOptLeftList;
