// Utils
import { pctChipClass, pctText } from "../utils";

// Interfaces
import type { WeekLine } from "../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareWeekBoxProps {
  label: string;
  dates: string;
  lines: WeekLine[];
  gap: string;
}

/** One week at the top: each list's figure and its change to this week, then
 *  who is ahead. The lead is plain text: one list ahead is not good or bad. */
const CompareWeekBox = ({ label, dates, lines, gap }: CompareWeekBoxProps) => (
  <div className="min-w-0 flex flex-col gap-1 px-2.5 py-2 rounded-md border border-line_field">
    <div className="flex flex-col items-center">
      <span className="cc-caps-strong text-[10.5px]">{label}</span>
      <span className="text-[11px] font-medium text-content">{dates}</span>
    </div>
    {lines.map((l) => (
      <div key={l.side} className="flex items-center gap-1.5 whitespace-nowrap">
        <ListBadge side={l.side} />
        <span className="text-[13px] font-bold text-content">{l.value}</span>
        <span className="min-w-0 truncate text-[11px] font-medium text-content">{l.other}</span>
        {l.pct !== null && (
          <span className={`cc-tag ml-auto flex-shrink-0 text-[11px] ${pctChipClass(l.pct)}`}>
            {pctText(l.pct)}
          </span>
        )}
      </div>
    ))}
    <div className="pt-1 border-t border-line_hair text-center truncate text-[12px] font-bold text-content">
      {gap}
    </div>
  </div>
);

export default CompareWeekBox;
