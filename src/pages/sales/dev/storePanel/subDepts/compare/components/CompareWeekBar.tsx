// Interfaces
import type { WeekBar } from "../interfaces";

interface CompareWeekBarProps {
  bar: WeekBar;
}

/** One week in the strip: who is ahead, then a bar split between the two
 *  lists with each half's figure and share. The lead is plain text: one list
 *  ahead is not good or bad. */
const CompareWeekBar = ({ bar }: CompareWeekBarProps) => (
  <div className="min-w-0 flex flex-col gap-0.5">
    <div className="flex items-baseline gap-1.5 whitespace-nowrap text-[11px] text-content">
      <span className="cc-caps-strong text-[10.5px]">{bar.label}</span>
      <span className="ml-auto truncate font-bold">{bar.gap}</span>
    </div>
    {bar.aShare === null ? (
      <div className="h-4 rounded-sm bg-fill_track" />
    ) : (
      <div className="flex h-4 rounded-sm overflow-hidden whitespace-nowrap text-[10.5px] font-bold text-custom-white">
        <div className="flex items-center pl-1.5 overflow-hidden bg-brand_navy" style={{ width: `${bar.aShare}%` }}>
          {bar.aFig} | {bar.aPct}
        </div>
        <div className="flex flex-1 min-w-0 items-center justify-end pr-1.5 overflow-hidden bg-brand_slate">
          {bar.bPct} | {bar.bFig}
        </div>
      </div>
    )}
  </div>
);

export default CompareWeekBar;
