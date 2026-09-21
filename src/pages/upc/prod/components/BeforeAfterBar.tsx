import { ExclamationCircleIcon } from "@heroicons/react/16/solid";

interface Props {
  label: string;
  descriptor?: string;
  beforePct: number;
  afterPct: number;
  beforeDisplay: string;
  afterDisplay: string;
  flagged?: boolean;
  note?: string;
}

// Stacked before/after rows plotted against a fixed 0-100 scale, not scaled
// to the pair's own max — the fill length has to mean the literal
// percentage, or a modest value next to a larger sibling reads as maxed
// out. Only for metrics genuinely bounded 0-100 (Confidence, Active rate).
// Anything without a natural ceiling belongs in a plain before/after text
// tile instead (see modules/trend/TrendBeforeAfterTile.tsx), not this bar.
const BeforeAfterBar = ({ label, descriptor, beforePct, afterPct, beforeDisplay, afterDisplay, flagged, note }: Props) => {
  return (
    <div className="bg-gray-200/60 rounded px-2.5 py-2 mb-2 last:mb-0">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-content/85">
            {label}
            {flagged && (
              <ExclamationCircleIcon className="w-4 h-4 text-amber-600" />
            )}
          </span>
          {descriptor && (
            <div className="text-[11px] text-content/85">{descriptor}</div>
          )}
        </div>
        <span className="text-[11px] text-content/85 font-medium">of 100%</span>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="flex-1 h-[20px] rounded bg-[#1e2a4a]/15">
          <div
            className="h-full rounded bg-[#1e2a4a]/60"
            style={{ width: `${beforePct}%` }}
          />
        </div>
        <span className="text-[11px] font-medium w-9 text-right tabular-nums">
          {beforeDisplay}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-[20px] rounded bg-blue-600/15">
          <div
            className="h-full rounded bg-blue-600/60"
            style={{ width: `${afterPct}%` }}
          />
        </div>
        <span className="text-[11px] font-medium w-9 text-right tabular-nums">
          {afterDisplay}
        </span>
      </div>
      {flagged && note && (
        <div className="text-[12px] font-medium text-amber-600 mt-1.5">
          {note}
        </div>
      )}
    </div>
  );
};

export default BeforeAfterBar;
