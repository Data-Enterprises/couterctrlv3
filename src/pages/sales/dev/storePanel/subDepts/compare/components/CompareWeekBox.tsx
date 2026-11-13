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

/** One week in the top band: each list's figure and its change to this week,
 *  then who is ahead. The lead is plain text: one list ahead is not good or bad. */
const CompareWeekBox = ({ label, dates, lines, gap }: CompareWeekBoxProps) => (
  <div className="min-w-0 flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md border border-line_field">
    <div className="flex items-baseline gap-1.5 whitespace-nowrap min-w-0">
      <span className="cc-caps-strong text-[10.5px]">{label}</span>
      <span className="truncate text-[11px] font-medium text-content">{dates}</span>
    </div>
    {lines.map((l) => (
      <div key={l.side} className="flex items-center gap-1.5 whitespace-nowrap">
        <ListBadge side={l.side} />
        <span className="text-[13px] font-bold text-content">{l.value}</span>
        <span className="min-w-0 truncate text-[11px] font-medium text-content">{l.other}</span>
        {l.pct !== null && (
          <span className={`cc-tag ml-auto flex-shrink-0 py-0 text-[11px] ${pctChipClass(l.pct)}`}>
            {pctText(l.pct)}
          </span>
        )}
      </div>
    ))}
    <div className="truncate text-[11.5px] font-bold text-content">{gap}</div>
  </div>
);

export default CompareWeekBox;
