// Hooks
import { useEffect, useMemo, useState } from "react";
import { useSalesCtx, useSalesState } from "../../../hooks";
import { useCounterpartHours } from "../hooks";

// Utils
import { metricFormat } from "../../../utils";
import { compareHourRows, hourBars, hourLabel, HOUR_COLS } from "../utils";

// Components
import LoadingIndicator from "../../../../../../components-dev/loading/LoadingIndicator";
import CompareHourRow from "./CompareHourRow";
import HourStat from "./HourStat";

interface HourlySideBySideProps {
  openStoreName: string;
  openStoreNumber: string;
  compareStoreId: number;
  /** Co-located stores share a storeid, so the rows have to be narrowed by
   *  number as well. */
  compareStoreNumber: string;
  compareStoreName: string;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  /**
   * The exact days last week and last year that correspond to this week's.
   *
   * The open store's hourly in the slice is already narrowed to these, because
   * the LY range is widened around holidays and the data itself is fragmented.
   * The counterpart has to be narrowed to the SAME set or the LW and LY
   * columns compare a filtered series against an unfiltered one — every
   * figure plausible, every one wrong.
   */
  lwWeekDates: string[];
  lyWeekDates: string[];
  onBack: () => void;
}

/**
 * Two stores' trading day, hour by hour.
 *
 * The same shape as the department comparison, pointed at time instead of
 * product: a list you look at on the left, one focused hour on the right.
 * It answers WHEN two stores diverge — a store that is level all morning and
 * loses the evening has a staffing or a closing problem, not a buying one.
 *
 * There is deliberately no way into the item investigation from here. That
 * view is scoped to a department, and an hour does not name one; offering a
 * button that quietly picked a department for you would be worse than not
 * offering it.
 */
const HourlySideBySide = ({
  openStoreName,
  openStoreNumber,
  compareStoreId,
  compareStoreNumber,
  compareStoreName,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
  lwWeekDates,
  lyWeekDates,
  onBack,
}: HourlySideBySideProps) => {
  const { gradingMetric } = useSalesCtx();
  // The open store's three weeks are already here — the panel fetched them
  // for its own Hourly tab, which is why only the counterpart is asked for.
  const { hourlySales, hourlySalesLastWeek, hourlySalesLastYear } =
    useSalesState();
  const { theirs, failed } = useCounterpartHours({
    compareStoreId,
    compareStoreNumber,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
    lwWeekDates,
    lyWeekDates,
  });

  const [mode, setMode] = useState<"money" | "mix">("money");
  const [picked, setPicked] = useState<number | null>(null);
  // A new counterpart or window starts on the first hour again.
  useEffect(() => {
    if (theirs === null) setPicked(null);
  }, [theirs]);

  const fmt = metricFormat(gradingMetric === "qty");

  const rows = useMemo(
    () =>
      theirs
        ? compareHourRows(
            {
              tw: hourlySales,
              lw: hourlySalesLastWeek,
              ly: hourlySalesLastYear,
            },
            theirs,
            gradingMetric,
          )
        : [],
    [
      theirs,
      hourlySales,
      hourlySalesLastWeek,
      hourlySalesLastYear,
      gradingMetric,
    ],
  );

  const { shareMine, shareTheirs, widthOf, gapOf, gapText } = hourBars(
    rows,
    mode,
    fmt,
  );

  const focus = rows.find((r) => r.hour === picked) ?? rows[0] ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-brand_navy/15 flex-shrink-0 bg-fill_soft">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-content hover:underline flex-shrink-0"
        >
          &lsaquo; All stores
        </button>
        <span className="text-[12px] text-content/95 truncate">
          How{" "}
          <span className="font-semibold text-content">{openStoreName}</span>{" "}
          trades against{" "}
          <span className="font-semibold text-content">{compareStoreName}</span>
          , hour by hour
        </span>

        <span className="ml-auto inline-flex rounded-full border border-brand_line overflow-hidden flex-shrink-0">
          {(["money", "mix"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[11.5px] font-semibold px-2.5 py-1 transition-colors ${
                mode === m
                  ? "bg-brand_navy text-custom-white"
                  : "bg-custom-white text-content hover:bg-fill_soft"
              }`}
            >
              {m === "money" ? "Money" : "Mix"}
            </button>
          ))}
        </span>
      </div>

      {failed ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/95">
          That store&rsquo;s hours could not be loaded.
        </div>
      ) : !theirs ? (
        <div className="relative flex-1">
          <LoadingIndicator message="Loading hours" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col border-r border-brand_navy/15">
            <div
              className="flex-shrink-0 grid gap-2.5 items-center px-3 py-1.5 border-b border-brand_navy/15 text-[11px] cc-caps"
              style={{ gridTemplateColumns: HOUR_COLS }}
            >
              <span>Hour</span>
              <span>
                {openStoreNumber} against {compareStoreNumber}
              </span>
              <span className="text-right">
                {mode === "money" ? "vs TY" : "Share"}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
              {rows.map((r) => (
                <CompareHourRow
                  key={r.hour}
                  row={r}
                  on={focus?.hour === r.hour}
                  mineWidth={widthOf(mode === "money" ? r.a : shareMine(r))}
                  theirsWidth={widthOf(mode === "money" ? r.b : shareTheirs(r))}
                  gap={gapOf(r)}
                  gapText={gapText(r)}
                  onPick={() => setPicked(r.hour)}
                />
              ))}

              {rows.length === 0 && (
                <div className="px-3 py-6 text-center text-[12.5px] text-content/95">
                  Neither store recorded hours in this window.
                </div>
              )}
            </div>
          </div>

          {focus && (
            <div className="w-[320px] flex-shrink-0 flex flex-col p-3 gap-3 overflow-auto thin-scrollbar">
              <div>
                <div className="text-[15px] font-bold text-content leading-snug">
                  {focus.label}
                  <span className="text-[12px] font-medium text-content/95">
                    {" "}
                    &ndash; {hourLabel((focus.hour + 1) % 24)}
                  </span>
                </div>
                {focus.b === 0 && (
                  <span className="inline-block mt-1.5 text-[10px] cc-tag uppercase tracking-wide bg-severity_watch_bg text-severity_watch_text">
                    {compareStoreNumber} rang nothing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md px-2.5 py-2 bg-store_open_tint">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content/95">
                    {openStoreNumber}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.a)}
                  </div>
                </div>
                <div className="rounded-md px-2.5 py-2 bg-store_compare_tint">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content/95">
                    {compareStoreNumber}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.b)}
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-brand_navy/15 rounded-md overflow-hidden">
                <HourStat label="vs TY" value={focus.tyDiff} fmt={fmt} />
                <HourStat label="vs LW" value={focus.lwDiff} fmt={fmt} />
                <HourStat label="vs LY" value={focus.lyDiff} fmt={fmt} />
              </div>

              <p className="text-[11.5px] text-content/95 leading-relaxed">
                This hour is{" "}
                <span className="font-semibold text-content">
                  {shareMine(focus).toFixed(1)}%
                </span>{" "}
                of {openStoreNumber}&rsquo;s takings and{" "}
                <span className="font-semibold text-content">
                  {shareTheirs(focus).toFixed(1)}%
                </span>{" "}
                of {compareStoreNumber}&rsquo;s
                {Math.abs(shareMine(focus) - shareTheirs(focus)) < 0.5 ? (
                  <> &mdash; near enough the same day.</>
                ) : (
                  <>
                    {" "}
                    &mdash;{" "}
                    <span className="font-semibold text-content">
                      {Math.abs(shareMine(focus) - shareTheirs(focus)).toFixed(
                        1,
                      )}{" "}
                      points
                    </span>{" "}
                    busier at{" "}
                    {shareMine(focus) > shareTheirs(focus)
                      ? openStoreNumber
                      : compareStoreNumber}
                    .
                  </>
                )}
              </p>

              {/* No way into the items from here, and saying so beats leaving
                  a reader hunting for one. An hour does not name a department,
                  and the investigation needs one. */}
              <p className="mt-auto text-[10.5px] text-content/95 leading-snug border-t border-brand_navy/15 pt-2.5">
                Hours say{" "}
                <span className="font-semibold text-content">when</span> the two
                diverge. For{" "}
                <span className="font-semibold text-content">what</span>, use
                Sub depts &mdash; the item investigation is scoped to a
                department.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HourlySideBySide;
