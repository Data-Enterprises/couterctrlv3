import { ChevronRightIcon, StarIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, formatCurrencyCompact } from "../../utils";
import { orDash, changeTone, signedPct } from "./trackerTone";
import { WEEK_GRID, DAY_GRID, NUM } from "./trackerColumns";
import TrendLine, { type TrendSeries } from "../../components/charts/TrendLine";
import VsLy from "./VsLy";
import type { WeekTotal } from "./trackerTotals";

interface WeekCardProps {
  week: WeekTotal;
  label: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  /** TY dates whose last-year partner is shared with another day. */
  collisions: Set<string>;
}

const shortDate = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

const dayName = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });

const HEAD = "text-[10.5px] font-semibold uppercase tracking-wide text-content/80";

/** Two periods, not two verdicts — so navy and a lighter tint of it, never the
 *  severity palette. The comparison carries the judgement, the lines don't. */
const TY_COLOR = "#1e2a4a";
const LY_COLOR = "#8aa4c4";

/**
 * One week of a sub department, with its days underneath.
 *
 * Closed, the card is one line: which week, the dates, what it took, and how
 * that compares. A column of these is a scannable list of weeks.
 *
 * Open, it leads with the day story — "5 days up · 2 down · worst day Sun 8/2
 * −15.06%", the sentence a manager can act on — then the chart, the days, and
 * a totals footer.
 *
 * Open, the chart runs the full width and the days are a table with a totals
 * footer. They were cards carrying four labelled figures each — twenty-eight
 * repeated labels per week, which is most of what made the panel noisy. A
 * header row says each label once and the footer makes the days visibly add up.
 */
const WeekCard = ({
  week,
  label,
  expanded,
  onToggle,
  collisions,
}: WeekCardProps) => {
  const incompleteDays = week.days.filter((d) => d.noSales).length;

  const series: TrendSeries[] = [
    {
      id: "This year",
      color: TY_COLOR,
      points: week.days.map((d) => (d.noSales ? null : d.salesTy)),
    },
    {
      // Dashed, not merely lighter. Two shades of the same hue stop being
      // distinguishable exactly where the lines cross, which is the point on
      // the chart most worth reading.
      id: "Last year",
      color: LY_COLOR,
      dashed: true,
      points: week.days.map((d) => d.salesLy),
    },
  ];

  return (
    // `flex-shrink-0` is load-bearing: these are flex children of a scrolling
    // column, and the default `flex-shrink: 1` makes every card compress to fit
    // rather than the column overflowing — then each is clipped by its own
    // `overflow-hidden`. Refusing to shrink is what makes the panel scroll.
    <div
      className={`flex-shrink-0 rounded-lg border overflow-hidden bg-custom-white ${
        expanded ? "border-row_selected_border" : "border-gray-200"
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
            <span className={`text-[12.5px] text-content whitespace-nowrap ${NUM}`}>
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
          />
        </span>
      </button>

      {expanded && (
        <>
          {/* The day story sits inside the open card. On every closed card it
              doubled the height of the list for a sentence you only act on once
              you are already looking at that week. */}
          <span className="flex items-baseline gap-2 px-3.5 py-2 text-[12px] border-t border-gray-100 bg-gray-50">
            {week.comparedDays === 0 ? (
              <span className="text-content">No last-year comparison</span>
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
            className="grid gap-3 px-3.5 py-1.5 bg-gray-50 border-t border-gray-100"
            style={{ gridTemplateColumns: DAY_GRID }}
          >
            <span className={HEAD}>Day</span>
            <span className={`${HEAD} text-right`}>TY sales</span>
            <span className={`${HEAD} text-right`}>LY sales</span>
            <span className={`${HEAD} text-right`}>ATS</span>
            <span className={`${HEAD} text-right`}>vs LY</span>
          </div>

          {week.days.map((d) => (
            <div
              key={d.date}
              className="grid items-center gap-3 px-3.5 py-1.5 border-t border-gray-100"
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
                  d.salesLy === null ? "text-content/50" : "text-content"
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
            className="grid items-center gap-3 px-3.5 py-2 border-t border-gray-200 bg-gray-50"
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
                week.salesLy === null ? "text-content/50" : "text-content"
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
