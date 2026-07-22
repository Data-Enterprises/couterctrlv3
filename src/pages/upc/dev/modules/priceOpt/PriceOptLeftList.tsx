import { formatCurrency2 } from "../../../../../utils";
import type { PriceOptRowSummary } from "./priceOptStats";
import { getPriceOptPhrase, getPreStorePhrase, type PriceOptTone } from "./priceOptPhrase";

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

// Headline is always Best price, never Current price — a row's not checked
// until it's been opened (and, in Group search, a store picked), so if the
// headline switched meaning per row depending on checked state, the same
// number would mean two different things with nothing to tell them apart.
const PriceOptLeftList = ({ rows, selectedCode, onSelect }: Props) => {
  return (
    <div className="w-[340px] flex-shrink-0 border-r border-gray-100 overflow-y-auto thin-scrollbar">
      {rows.map((r) => {
        const phrase = r.isChecked
          ? getPriceOptPhrase(r.status!, r.risk!)
          : getPreStorePhrase(r.points, r.elasticity);
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
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-[10px] text-content/85 font-mono truncate">{r.code}</span>
              <span className={`text-[10.5px] flex-shrink-0 ${TONE_TEXT[phrase.tone]}`}>
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
