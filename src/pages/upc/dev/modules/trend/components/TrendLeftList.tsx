// Utils
import { impactUnits } from "../trendStats";
import { getTrendPhrase, TONE_TEXT } from "../utils";

// Interfaces
import type { TrendStatus } from "../interfaces";
import type { UpcTrend } from "../../../../../../interfaces";
import type { UpcTrendWindow } from "../../../../../../features/dev/devUpcDevSlice";

interface TrendLeftListProps {
  rows: { t: UpcTrend; status: TrendStatus }[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  fixes: boolean;
  window: UpcTrendWindow | null;
}

/** The Trend tab's left list: one row per item with its impact units (an arrow and count,
 *  a dash when it has no prior history), code and status label. The headline is impact
 *  units, Trend's own unit, matching the KPI strip. */
const TrendLeftList = ({ rows, selectedCode, onSelect, fixes, window }: TrendLeftListProps) => {
  return (
    <div className="w-[340px] flex-shrink-0 border-r border-line_hair overflow-y-auto thin-scrollbar">
      {rows.map(({ t, status }) => {
        const phrase = getTrendPhrase(status);
        const impact = Math.round(impactUnits(t, fixes, window));
        // Nothing to compare against, so no arrow and no colour — a green
        // zero read as a verdict on an item that simply has no before.
        const noBaseline = status === "new";
        const isSelected = t.product_code === selectedCode;
        return (
          <button
            key={t.product_code}
            onClick={() => onSelect(t.product_code)}
            className={`w-full text-left px-2.5 py-2 border-b border-line_faint transition-colors ${
              isSelected ? "bg-custom-white" : "hover:bg-gray-50"
            }`}
            style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-content truncate">{t.product_description}</span>
              <span
                className={`text-[12px] font-semibold tabular-nums flex-shrink-0 ${
                  noBaseline
                    ? "text-content/95"
                    : impact < 0
                    ? "text-severity_critical_text"
                    : "text-severity_healthy_text"
                }`}
              >
                {noBaseline ? "—" : `${impact >= 0 ? "▲" : "▼"}${Math.abs(impact).toLocaleString()}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 font-medium">
              <span className="text-[11px] text-content/95 truncate">{t.product_code}</span>
              <span className={`text-[11px] flex-shrink-0 ${TONE_TEXT[phrase.tone]}`}>{phrase.text}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TrendLeftList;
