// Utils
import { contributionGap } from "../utils/topItems";
import { dayText, moneyText } from "../utils";

interface TotalsStripProps {
  oneDay: boolean;
  start: string;
  end: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  totals: { ty: number; lw: number | null; ly: number | null };
  /** The share of each period's net sales these items carried. */
  share: { ty: number | null; lw: number | null; ly: number | null };
}

/** The landing's three tiles: the top 200's sales, then against each baseline. */
const TotalsStrip = ({
  oneDay,
  start,
  end,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
  totals,
  share,
}: TotalsStripProps) => (
  <div className="grid grid-cols-3 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
    <div className="px-4 pt-2.5 pb-2 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wide text-content">
        Top 200 Sales
      </div>
      <div className="text-[10px] font-bold text-content mb-0.5">
        {oneDay ? dayText(start) : <>{dayText(start)} &ndash; {dayText(end)}</>}
      </div>
      <div className="text-[14px] font-bold text-content tabular-nums">
        {moneyText(totals.ty)}
      </div>
      <div className="text-[11.5px] text-content/95 tabular-nums">
        {share.ty === null
          ? "—"
          : `${share.ty.toFixed(1)}% of net sales`}
      </div>
    </div>
    {(
      [
        [
          "vs Last Week",
          lwStart,
          lwEnd,
          totals.lw,
          share.lw,
          contributionGap(share.ty, share.lw),
        ],
        [
          "vs Last Year",
          lyStart,
          lyEnd,
          totals.ly,
          share.ly,
          contributionGap(share.ty, share.ly),
        ],
      ] as const
    ).map(([label, from, to, value, pct, gap]) => (
      <div key={label} className="px-4 pt-2.5 pb-2 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wide text-content">
          {label}
        </div>
        {/* A picked day is one date, as Top 200 Sales shows it,
            not that date written as a range to itself. */}
        <div className="text-[10px] font-bold text-content mb-0.5">
          {oneDay ? dayText(from) : <>{dayText(from)} &ndash; {dayText(to)}</>}
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-[14px] font-bold text-content tabular-nums">
            {moneyText(value)}
          </span>
          {/* Points of contribution, not a change in dollars. It
              is a direction, not a grade: a threshold built for a
              sales percentage would call three points of share a
              rounding error. */}
          {gap !== null && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                gap > 0
                  ? "bg-delta_positive_bg text-delta_positive_text"
                  : gap < 0
                    ? "bg-delta_negative_bg text-delta_negative_text"
                    : "bg-gray-100 text-content"
              }`}
            >
              {/* "pts", not "%": 43.3% of net sales against 30.2%
                  is 13.1 points. Read as "+13.1%" it said sales
                  rose 13%, when they rose 59.5% (dev board review,
                  finding 1). */}
              {`${gap > 0 ? "+" : gap < 0 ? "−" : ""}${Math.abs(gap).toFixed(1)} pts`}
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-content/95 tabular-nums">
          {pct === null ? "—" : `${pct.toFixed(1)}% of net sales`}
        </div>
      </div>
    ))}
  </div>
);

export default TotalsStrip;
