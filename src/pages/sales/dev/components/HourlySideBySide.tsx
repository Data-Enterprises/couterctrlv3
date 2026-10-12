import { useEffect, useMemo, useState } from "react";
import { getHourly } from "../../../../api/sales";
import { formatCurrency2, formatBigNumber, addDays, sameWeekDayLastYear } from "../../../../utils";
import { useAppSelector } from "../../../../hooks";
import { useSalesState } from "../hooks/useSalesState";
import { scopeToStoreNumber } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import type { HourlySale } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

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

/** A real minus, not a hyphen: these sit in tabular figures beside a plus. */
const MINUS = "−";

interface Row {
  hour: number;
  label: string;
  /** The open store's hour. */
  a: number;
  /** The counterpart's. */
  b: number;
  tyDiff: number;
  lwDiff: number;
  lyDiff: number;
}

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "a" : "p";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${suffix}`;
};

const value = (h: HourlySale, metric: GradingMetric) =>
  metric === "qty" ? h.qty : h.total_sales - h.total_tax;

const byHour = (rows: HourlySale[], metric: GradingMetric) =>
  rows.reduce<Record<number, number>>((acc, h) => {
    acc[h.hour] = (acc[h.hour] ?? 0) + value(h, metric);
    return acc;
  }, {});

const day = (v: string) => (v ?? "").split("T")[0];

interface Props {
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
  /** A day picked in the strip above narrows both sides to that day. */
  selectedDate: string | null;
  gradingMetric: GradingMetric;
  onBack: () => void;
}

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
  selectedDate,
  gradingMetric,
  onBack,
}: Props) => {
  const context = useAppSelector((state) => state.app);
  // The open store's three weeks are already here — the panel fetched them
  // for its own Hourly tab, which is why only the counterpart is asked for.
  const { hourlySales, hourlySalesLastWeek, hourlySalesLastYear } =
    useSalesState();

  const [theirs, setTheirs] = useState<{
    tw: HourlySale[];
    lw: HourlySale[];
    ly: HourlySale[];
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<"money" | "mix">("money");
  const [picked, setPicked] = useState<number | null>(null);

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) => (isQty ? formatBigNumber(v, 0) : formatCurrency2(v));

  const lwKey = lwWeekDates.join(",");
  const lyKey = lyWeekDates.join(",");

  useEffect(() => {
    let live = true;
    setTheirs(null);
    setFailed(false);
    setPicked(null);

    const ask = (from: string, to: string) =>
      getHourly(context.url, context.token, from, to, 0, compareStoreId, 1);

    Promise.all([ask(twStart, twEnd), ask(lwStart, lwEnd), ask(lyStart, lyEnd)])
      .then(([tw, lw, ly]) => {
        if (!live) return;
        // The house convention: a 200 carrying `error`, so `error === 0` is
        // the success test. Scoped by store NUMBER, because co-located stores
        // share an id.
        const take = (resp: { data: { error: number; subs: HourlySale[] } }) =>
          resp.data.error === 0
            ? scopeToStoreNumber(resp.data.subs ?? [], compareStoreNumber)
            : [];

        // Narrowed exactly as the open store's were on the way in.
        const lwSet = new Set(lwWeekDates);
        const lySet = new Set(lyWeekDates);
        const lwDay = selectedDate
          ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
          : null;
        const lyDay = selectedDate ? sameWeekDayLastYear(selectedDate).date : null;

        setTheirs({
          tw: selectedDate
            ? take(tw).filter((h) => day(h.sale_date) === selectedDate)
            : take(tw),
          lw: take(lw).filter((h) =>
            lwDay ? day(h.sale_date) === lwDay : lwSet.has(day(h.sale_date)),
          ),
          ly: take(ly).filter((h) =>
            lyDay ? day(h.sale_date) === lyDay : lySet.has(day(h.sale_date)),
          ),
        });
      })
      .catch(() => live && setFailed(true));

    return () => {
      live = false;
    };
  }, [
    context.url, context.token,
    twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd,
    compareStoreId, compareStoreNumber,
    lwKey, lyKey, selectedDate,
    lwWeekDates, lyWeekDates,
  ]);

  const rows = useMemo<Row[]>(() => {
    if (!theirs) return [];
    const mineTw = byHour(hourlySales, gradingMetric);
    const mineLw = byHour(hourlySalesLastWeek, gradingMetric);
    const mineLy = byHour(hourlySalesLastYear, gradingMetric);
    const theirTw = byHour(theirs.tw, gradingMetric);
    const theirLw = byHour(theirs.lw, gradingMetric);
    const theirLy = byHour(theirs.ly, gradingMetric);

    // Every hour either store traded in any period. An hour one of them is
    // shut for is a finding, not a row to drop.
    const hours = [
      ...new Set(
        [mineTw, mineLw, mineLy, theirTw, theirLw, theirLy]
          .flatMap((m) => Object.keys(m))
          .map(Number),
      ),
    ].sort((x, y) => x - y);

    return hours.map((h) => {
      const a = mineTw[h] ?? 0;
      const b = theirTw[h] ?? 0;
      return {
        hour: h,
        label: hourLabel(h),
        a,
        b,
        tyDiff: a - b,
        lwDiff: (mineLw[h] ?? 0) - (theirLw[h] ?? 0),
        lyDiff: (mineLy[h] ?? 0) - (theirLy[h] ?? 0),
      };
    });
  }, [theirs, hourlySales, hourlySalesLastWeek, hourlySalesLastYear, gradingMetric]);

  const mineTotal = rows.reduce((t, r) => t + r.a, 0);
  const theirsTotal = rows.reduce((t, r) => t + r.b, 0);
  const shareMine = (r: Row) => (mineTotal > 0 ? (r.a / mineTotal) * 100 : 0);
  const shareTheirs = (r: Row) => (theirsTotal > 0 ? (r.b / theirsTotal) * 100 : 0);

  const barMax =
    mode === "money"
      ? Math.max(1, ...rows.flatMap((r) => [r.a, r.b]))
      : Math.max(1, ...rows.flatMap((r) => [shareMine(r), shareTheirs(r)]));

  const widthOf = (v: number) => Math.min(100, (v / barMax) * 100) + "%";
  const gapOf = (r: Row) =>
    mode === "money" ? r.tyDiff : shareMine(r) - shareTheirs(r);
  const gapText = (r: Row) => {
    const g = gapOf(r);
    const sign = g >= 0 ? "+" : MINUS;
    return mode === "money"
      ? sign + fmt(Math.abs(g))
      : sign + Math.abs(g).toFixed(1) + " pts";
  };

  const focus = rows.find((r) => r.hour === picked) ?? rows[0] ?? null;
  const COLS = "70px minmax(90px,2fr) 104px";

  const stat = (key: string, v: number) => (
    <div className="flex items-baseline gap-2 px-3 py-2 bg-custom-white">
      <span className="text-[11.5px] text-content/85 w-[52px] flex-shrink-0">{key}</span>
      <span
        className={`ml-auto tabular-nums text-[13.5px] font-bold ${
          v >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
        }`}
      >
        {v >= 0 ? "+" : MINUS}
        {fmt(Math.abs(v))}
      </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-brand_navy/15 flex-shrink-0 bg-gray-50">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-content hover:underline flex-shrink-0"
        >
          &lsaquo; All stores
        </button>
        <span className="text-[12px] text-content/85 truncate">
          How <span className="font-semibold text-content">{openStoreName}</span>{" "}
          trades against{" "}
          <span className="font-semibold text-content">{compareStoreName}</span>,
          hour by hour
        </span>

        <span className="ml-auto inline-flex rounded-full border border-brand_line overflow-hidden flex-shrink-0">
          {(["money", "mix"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[11.5px] font-semibold px-2.5 py-1 transition-colors ${
                mode === m
                  ? "bg-brand_navy text-custom-white"
                  : "bg-custom-white text-content hover:bg-gray-50"
              }`}
            >
              {m === "money" ? "Money" : "Mix"}
            </button>
          ))}
        </span>
      </div>

      {failed ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
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
              className="flex-shrink-0 grid gap-2.5 items-center px-3 py-1.5 border-b border-brand_navy/15 text-[11px] font-semibold uppercase tracking-wide text-content/85"
              style={{ gridTemplateColumns: COLS }}
            >
              <span>Hour</span>
              <span>
                {openStoreNumber} against {compareStoreNumber}
              </span>
              <span className="text-right">{mode === "money" ? "vs TY" : "Share"}</span>
            </div>

            <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
              {rows.map((r) => {
                const g = gapOf(r);
                const on = focus?.hour === r.hour;
                return (
                  <button
                    key={r.hour}
                    onClick={() => setPicked(r.hour)}
                    className={`w-full text-left grid gap-2.5 items-center px-3 py-2 border-b border-brand_navy/15 transition-colors ${
                      on
                        ? "bg-row_selected border-row_selected_border"
                        : "hover:bg-gray-50"
                    }`}
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span className="tabular-nums text-[12.5px] font-medium text-content">
                      {r.label}
                    </span>

                    <span className="grid gap-[3px] min-w-0">
                      <span className="block h-2 rounded-sm bg-bkg">
                        <span
                          className="block h-2 rounded-sm bg-store_open"
                          style={{ width: widthOf(mode === "money" ? r.a : shareMine(r)) }}
                        />
                      </span>
                      {/* An hour they were shut gets a hatched full track, not
                          a zero-width bar nobody can see. */}
                      <span className="block h-2 rounded-sm bg-bkg">
                        <span
                          className="block h-2 rounded-sm"
                          style={
                            r.b === 0
                              ? {
                                  width: "100%",
                                  background:
                                    "repeating-linear-gradient(45deg, rgb(var(--color-severity-watch-bg)) 0 4px, transparent 4px 8px)",
                                }
                              : {
                                  width: widthOf(mode === "money" ? r.b : shareTheirs(r)),
                                  background: "rgb(var(--color-store-compare))",
                                }
                          }
                        />
                      </span>
                    </span>

                    <span
                      className={`text-right tabular-nums text-[12px] font-semibold ${
                        g >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
                      }`}
                    >
                      {gapText(r)}
                    </span>
                  </button>
                );
              })}

              {rows.length === 0 && (
                <div className="px-3 py-6 text-center text-[12.5px] text-content/85">
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
                  <span className="text-[12px] font-medium text-content/85">
                    {" "}&ndash; {hourLabel((focus.hour + 1) % 24)}
                  </span>
                </div>
                {focus.b === 0 && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text">
                    {compareStoreNumber} rang nothing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md px-2.5 py-2 bg-store_open_tint">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
                    {openStoreNumber}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.a)}
                  </div>
                </div>
                <div className="rounded-md px-2.5 py-2 bg-store_compare_tint">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
                    {compareStoreNumber}
                  </div>
                  <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
                    {fmt(focus.b)}
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-brand_navy/15 rounded-md overflow-hidden">
                {stat("vs TY", focus.tyDiff)}
                {stat("vs LW", focus.lwDiff)}
                {stat("vs LY", focus.lyDiff)}
              </div>

              <p className="text-[11.5px] text-content/85 leading-relaxed">
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
                      {Math.abs(shareMine(focus) - shareTheirs(focus)).toFixed(1)} points
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
              <p className="mt-auto text-[10.5px] text-content/85 leading-snug border-t border-brand_navy/15 pt-2.5">
                Hours say <span className="font-semibold text-content">when</span>{" "}
                the two diverge. For <span className="font-semibold text-content">what</span>,
                use Sub depts &mdash; the item investigation is scoped to a department.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HourlySideBySide;
