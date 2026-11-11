// Utils
import { formatCurrency2, formatCurrencyCompact } from "../../../../../utils";
import { orDash, changeTone, signedPct } from "../../utils/trackerTone";
import { WEEK_GRID, DAY_GRID, NUM } from "../../utils/trackerColumns";
import { basisWord } from "../../utils";
import { dayName, HEAD, LY_COLOR, shortDate, TY_COLOR } from "../utils";

// Interfaces
import type { WeekTotal, TrackerBasis } from "../../interfaces";
import type { TrendSeries } from "../../../../../components-dev/charts/interfaces";

// Components
import { ChevronRightIcon, StarIcon } from "@heroicons/react/20/solid";
import TrendLine from "../../../../../components-dev/charts/TrendLine";
import VsLy from "../../components/VsLy";

interface WeekCardProps {
  week: WeekTotal;
  label: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  /** TY dates whose last-year partner is shared with another day. */
  collisions: Set<string>;
  /** What the comparison column and the dashed line are. */
  basis: TrackerBasis;
}

/**
 * One week of a sub department. Closed: one line (week, dates, takings,
 * comparison). Open: the day story ("5 days up · 2 down · worst day Sun 8/2
 * −15.06%"), the chart, then the days as a table with a totals footer.
 */
const WeekCard = ({
  week,
  label,
  expanded,
  onToggle,
  collisions,
  basis,
}: WeekCardProps) => {
  const incompleteDays = week.days.filter((d) => d.noSales).length;

  const series: TrendSeries[] = [
    {
      id: "This year",
      color: TY_COLOR,
      points: week.days.map((d) => (d.noSales ? null : d.salesTy)),
    },
    {
      // Dashed, not lighter: two shades of one hue blur where the lines cross.
      id: basis === "LW" ? "Last week" : "Last year",
      color: LY_COLOR,
      dashed: true,
      points: week.days.map((d) => d.salesLy),
    },
  ];

  return (
    // `flex-shrink-0` is load-bearing: without it the cards compress to fit and
    // clip, instead of the column scrolling.
    <div
      className={`flex-shrink-0 rounded-lg border overflow-hidden bg-custom-white ${
        expanded ? "border-row_selected_border" : "border-line_field"
      }`}
    >
      <button
        onClick={() => onToggle(week.index)}
        className={`w-full px-3.5 py-2.5 text-left transition-colors ${
          expanded ? "bg-row_selected" : "hover:bg-gray-50"
        }`}
      >
        <span
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: WEEK_GRID }}
        >
          <ChevronRightIcon
            className={`w-4 h-4 text-content flex-shrink-0 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-content whitespace-nowrap">
              Week {label}
            </span>
            <span
              className={`text-[12.5px] text-content whitespace-nowrap ${NUM}`}
            >
              {shortDate(week.start)} – {shortDate(week.end)}
            </span>
          </span>
          <span
            className={`text-[13.5px] font-semibold text-content text-right ${NUM}`}
          >
            {formatCurrency2(week.salesTy)}
          </span>
          <VsLy
            dollarChange={week.dollarChange}
            pctChange={week.pctChange}
            variant="pill"
            basis={basis}
          />
        </span>
      </button>

      {expanded && (
        <>
          {/* The day story sits inside the open card only. */}
          <span className="flex items-baseline gap-2 px-3.5 py-2 text-[12px] border-t border-line_hair bg-gray-50">
            {week.comparedDays === 0 ? (
              <span className="text-content">
                No {basisWord(basis)} comparison
              </span>
            ) : (
              <>
                <span className="font-semibold text-severity_healthy_text">
                  {week.upDays} {week.upDays === 1 ? "day" : "days"} up
                </span>
                <span className="text-content">·</span>
                <span className="font-semibold text-severity_critical_text">
                  {week.downDays} down
                </span>
                {week.worstDay && (
                  <>
                    <span className="text-content">·</span>
                    <span className="text-content truncate">
                      worst day {dayName(week.worstDay.date)}{" "}
                      {shortDate(week.worstDay.date)}{" "}
                      <span
                        className={`font-semibold ${NUM} ${changeTone(week.worstDay.pctChange)}`}
                      >
                        {signedPct(week.worstDay.pctChange)}
                      </span>
                    </span>
                  </>
                )}
                {incompleteDays > 0 && (
                  <>
                    <span className="text-content">·</span>
                    <span className="text-content whitespace-nowrap">
                      {week.days.length - incompleteDays} of {week.days.length}{" "}
                      days
                    </span>
                  </>
                )}
              </>
            )}

            <span className="flex-1" />

            <span className="text-content whitespace-nowrap">
              ATS{" "}
              <span className={`font-semibold ${NUM}`}>
                {orDash(week.ats, formatCurrency2)}
              </span>
            </span>
          </span>

          <div className="px-2 pt-3 pb-1">
            <TrendLine
              series={series}
              labels={week.days.map((d) => dayName(d.date))}
              formatValue={formatCurrencyCompact}
              formatPoint={(id, i, v) =>
                `${id} · ${shortDate(week.days[i].date)} · ${formatCurrency2(v)}`
              }
            />
          </div>

          <div
            className="grid gap-3 px-3.5 py-1.5 bg-gray-50 border-t border-line_hair"
            style={{ gridTemplateColumns: DAY_GRID }}
          >
            <span className={HEAD}>Day</span>
            <span className={`${HEAD} text-right`}>TY sales</span>
            <span className={`${HEAD} text-right`}>{basis} sales</span>
            <span className={`${HEAD} text-right`}>ATS</span>
            <span className={`${HEAD} text-right`}>vs {basis}</span>
          </div>

          {week.days.map((d) => (
            <div
              key={d.date}
              className="grid items-center gap-3 px-3.5 py-1.5 border-t border-line_hair"
              style={{ gridTemplateColumns: DAY_GRID }}
            >
              <span className="flex items-baseline gap-2 min-w-0">
                <span className="text-[12.5px] font-semibold text-content">
                  {dayName(d.date)}
                </span>
                <span className={`text-[11.5px] text-content ${NUM}`}>
                  {shortDate(d.date)}
                </span>
                {collisions.has(d.date) && (
                  // Wrapped rather than putting `title` on the svg: an SVG title
                  // attribute is not a tooltip, it just sits in the markup.
                  <span
                    title="Holiday pairing — this day shares its matched day last year"
                    className="flex items-center"
                  >
                    <StarIcon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  </span>
                )}
              </span>

              <span
                className={`text-[12.5px] font-medium text-content text-right ${NUM}`}
              >
                {d.noSales ? "—" : formatCurrency2(d.salesTy)}
              </span>

              {/* Greyed when absent, so a day with no matching day last year
                  reads as uncomparable rather than as a day that took nothing. */}
              <span
                className={`text-[12.5px] text-right ${NUM} ${
                  d.salesLy === null ? "text-content/95" : "text-content"
                }`}
              >
                {orDash(d.salesLy, formatCurrency2)}
              </span>

              <span className={`text-[12.5px] text-content text-right ${NUM}`}>
                {orDash(d.ats, formatCurrency2)}
              </span>

              <VsLy
                dollarChange={d.dollarChange}
                pctChange={d.pctChange}
                size="day"
                colored={false}
              />
            </div>
          ))}

          {/* Footer, so the days visibly add up to the line on the card header
              rather than asking the reader to take it on trust. */}
          <div
            className="grid items-center gap-3 px-3.5 py-2 border-t border-line_field bg-gray-50"
            style={{ gridTemplateColumns: DAY_GRID }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-content">
              Week {label} totals
            </span>
            <span
              className={`text-[12.5px] font-semibold text-content text-right ${NUM}`}
            >
              {formatCurrency2(week.salesTy)}
            </span>
            <span
              className={`text-[12.5px] font-semibold text-right ${NUM} ${
                week.salesLy === null ? "text-content/95" : "text-content"
              }`}
            >
              {orDash(week.salesLy, formatCurrency2)}
            </span>
            <span
              className={`text-[12.5px] font-semibold text-content text-right ${NUM}`}
            >
              {orDash(week.ats, formatCurrency2)}
            </span>
            {/* The footer keeps the colour: it is the same figure as the week
                line at the top of the card, so the two must agree on sight. */}
            <VsLy
              dollarChange={week.dollarChange}
              pctChange={week.pctChange}
              size="day"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WeekCard;
