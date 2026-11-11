// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { getPriceOptPhrase, TONE_TEXT } from "../utils";

// Interfaces
import type { PriceOptRowSummary } from "../interfaces";

interface PriceOptLeftListProps {
  rows: PriceOptRowSummary[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

/** The Price Opt tab's left list: one row per item with its best price (per pound on scale
 *  items), code and an elasticity phrase. The headline is always Best price: there is no
 *  current price to compare. */
const PriceOptLeftList = ({ rows, selectedCode, onSelect }: PriceOptLeftListProps) => {
  return (
    <div className="w-[340px] flex-shrink-0 border-r border-line_hair overflow-y-auto thin-scrollbar">
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
                {/* Per pound, on a scale item — the figure means a different
                    thing without this and the list mixes both kinds. */}
                {r.weighted && <span className="font-normal text-content/95">/lb</span>}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 font-medium">
              <span className="text-[11px] text-content/95 truncate">{r.code}</span>
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
