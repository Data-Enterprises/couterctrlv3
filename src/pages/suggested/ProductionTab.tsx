import { useMemo } from "react";
import { useSuggestedCtx } from "./hooks";
import { buildBenchmark, deptLabel, fmtLb, fmtLb0, median } from ".";
import { dailyKey } from "../../interfaces";
import SoldPerDayStrip from "./SoldPerDayStrip";
import { getStoreName } from "../../utils";
import type { SuggestedGroupRow } from "../../interfaces";

/** Sunday first, matching the `dow_rates` keys and Postgres' extract(dow). */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * What this department produces, what it actually sold, and how that compares.
 *
 * The manager's reading, and the reason the sold-per-day strip moved off the
 * Order tab: four weeks of history is a record, not an input to Friday's order,
 * and it was the band crowding the sheet.
 *
 * The typical-week band deliberately repeats numbers the Order tab shows. The
 * cards there are the four weekdays THIS ORDER covers; this is all seven, which
 * is what someone planning a production week needs. Stacked under the actual
 * days, the gap between the two rows is the whole point of the tab.
 */
const ProductionTab = ({
  groupRow,
  subDepartment,
}: {
  groupRow?: SuggestedGroupRow;
  /** Taken from the sheet key rather than off `groupRow`, which can be missing —
   *  falling back to null there would benchmark the "No department" bucket
   *  against a department that simply had no rollup row. */
  subDepartment: number | null;
}) => {
  const ctx = useSuggestedCtx();

  const rates = groupRow?.dow_rates;
  const avgDay = groupRow?.avg_daily_weight ?? 0;
  const peakDay = useMemo(() => {
    if (!rates) return null;
    let best = 0;
    for (let d = 1; d < 7; d++) {
      if ((rates[String(d)] ?? 0) > (rates[String(best)] ?? 0)) best = d;
    }
    return best;
  }, [rates]);
  const maxRate = useMemo(
    () =>
      rates
        ? Math.max(...Array.from({ length: 7 }, (_, d) => rates[String(d)] ?? 0))
        : 0,
    [rates],
  );

  /**
   * This department's day-by-day history.
   *
   * Looked up by store and department rather than read off the row: the
   * endpoint returns one series per department under `daily_by_department`,
   * because the same series hanging on 380 item rows read as each item's own
   * history and duplicated ~10,000 entries to carry about eight distinct ones.
   */
  const series = ctx.activeStoreId
    ? ctx.dailyByDepartment?.[dailyKey(ctx.activeStoreId, subDepartment)]
    : undefined;

  const bench = useMemo(
    () =>
      buildBenchmark(ctx.groupRows, subDepartment, (id, fb) =>
        getStoreName(ctx.assignedStores, id, fb),
      ),
    [ctx.groupRows, subDepartment, ctx.assignedStores],
  );
  const benchMedian = useMemo(
    () => median(bench.map((b) => b.lbPerItem)),
    [bench],
  );
  const benchMax = bench.length ? bench[0].lbPerItem : 0;

  return (
    /**
     * The strips are fixed and the store list is the one thing that scrolls.
     *
     * The tab used to scroll as a whole, which pushed the weekday bars out of
     * view the moment anyone went looking at where their store sat — and those
     * two readings are meant to be compared, not paged between. `flex-shrink-0`
     * on the strips is load-bearing: without it they compress instead of the
     * list scrolling, which looks like a scroll bug and is not one.
     */
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {series?.series.length ? (
        <SoldPerDayStrip daily={series.series} dailyAvg={series.avg} />
      ) : (
        <div className="flex-shrink-0 px-3 py-3 border-b border-gray-100 bg-gray-50 text-[12px] text-content/85">
          No day-by-day history came back for this department.
        </div>
      )}

      {/* ── the typical week, all seven ── */}
      {rates && maxRate > 0 && (
        <div className="flex-shrink-0 px-3 pt-2 pb-3 border-b border-gray-100 bg-custom-white">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
              Typical week · all seven days
            </span>
            <span className="text-[12px] text-content/85">
              the Order tab shows the days this order covers
            </span>
          </div>

          <div className="flex items-end gap-1.5 h-16 relative">
            {avgDay > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-[#1e2a4a]/40 pointer-events-none"
                style={{ bottom: `${Math.min((avgDay / maxRate) * 100, 100)}%` }}
                title={`${fmtLb(avgDay)} lb on an average day`}
              />
            )}
            {DAYS.map((name, d) => {
              const lb = rates[String(d)] ?? 0;
              return (
                <div
                  key={d}
                  title={`${name}s average ${fmtLb(lb)} lb here`}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: lb > 0 ? `${Math.max((lb / maxRate) * 100, 3)}%` : 0,
                    background: d === peakDay ? "#1e2a4a" : "#1e2a4a99",
                  }}
                />
              );
            })}
          </div>

          <div className="flex gap-1.5 mt-1.5">
            {SHORT.map((s, d) => (
              <div key={d} className="flex-1 text-center">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
                  {s}
                </div>
                <div className="text-[13px] font-semibold text-content tabular-nums">
                  {fmtLb0(rates[String(d)] ?? 0)}
                </div>
              </div>
            ))}
          </div>

          {peakDay !== null && avgDay > 0 && (
            <p className="text-[12px] text-content/85 mt-2 leading-snug">
              {DAYS[peakDay]}s run{" "}
              <span className="font-semibold text-content">
                {(((rates[String(peakDay)] ?? 0) / avgDay - 1) * 100).toFixed(0)}%
              </span>{" "}
              above an ordinary day here. These are 12-week averages per weekday,
              not forecasts for particular dates.
            </p>
          )}
        </div>
      )}

      {/* ── where this store stands ── */}
      {bench.length > 1 && (
        <div className="flex-1 min-h-0 flex flex-col px-3 pt-2 pb-3">
          <div className="flex-shrink-0 flex items-baseline justify-between mb-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
              {deptLabel(groupRow?.sub_department_description ?? null)} · lb per
              day per item carried · {bench.length} stores
            </span>
            <span className="text-[12px] text-content/85 tabular-nums">
              group median{" "}
              <span className="font-semibold text-content">
                {benchMedian.toFixed(2)}
              </span>{" "}
              lb/item
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col gap-0.5">
            {bench.map((b) => {
              const me = b.storeid === ctx.activeStoreId;
              return (
                <div
                  key={b.storeid}
                  className={`grid items-center gap-2 text-[12px] ${
                    me ? "font-semibold text-content" : "text-content/85"
                  }`}
                  style={{ gridTemplateColumns: "1fr 2fr 78px 44px 66px" }}
                  title={`${fmtLb0(b.lbPerDay)} lb/day across ${b.itemCount} items`}
                >
                  <span className="truncate">{b.label}</span>
                  <span className="bg-gray-200 rounded-sm h-2.5 overflow-hidden">
                    <span
                      className="block h-full rounded-sm"
                      style={{
                        width: `${benchMax > 0 ? (b.lbPerItem / benchMax) * 100 : 0}%`,
                        background: me ? "#1e2a4a" : "#1e2a4a99",
                      }}
                    />
                  </span>
                  <span className="text-right tabular-nums">
                    {b.lbPerItem.toFixed(2)} lb/item
                  </span>
                  <span className="text-right tabular-nums text-content/85">
                    {b.itemCount}
                  </span>
                  <span className="text-right tabular-nums text-content/85">
                    {fmtLb0(b.lbPerDay)} lb
                  </span>
                </div>
              );
            })}
          </div>

          <p className="flex-shrink-0 text-[12px] text-content/85 mt-2 leading-snug">
            Per item carried, not raw pounds. A store stocking five meat items
            against another&rsquo;s hundred and eighty reads as down 99% on raw
            pounds and has simply not got a meat case; dividing by the count is
            what makes the two comparable.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductionTab;
