import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCase } from "../../../features/lpActionsSlice";
import { formatCurrency2, formatDateSimple } from "../../../utils";
import { buildStandings } from "../profiles/rollupStats";
import { colourFor } from "./chartTheme";
import type { CashierRef } from "../lpActionsMetrics";

/**
 * This cashier's whole record: every exception they rang, every week.
 *
 * It replaces the tab strip, and does more than it did. The strip said which
 * types this operator touched and roughly how hard; this says the same thing
 * with the weeks spelled out, so "specific to cancels" and "generally loose"
 * stop being a judgement call about a multiplier and become two obviously
 * different shapes on the page.
 *
 * It is also still the selector — clicking a row re-points the case at that
 * type, which is the one thing the strip was actually for. A table that
 * chooses is strictly better than a row of chips above a table, because the
 * numbers you are choosing between are right there.
 *
 * The swatch is the charts' series colour, from the same `colourFor` the
 * charts call, so the row and the line are visibly the same thing.
 *
 * A cell is marked when it is above THEIR OWN weekly rate before the graded
 * week — not the store's, not the group's. This block is about one person's
 * history with themselves; the store and peer comparisons live on the panel
 * this case was opened from.
 */
interface Props {
  cashier: CashierRef;
  selected: string;
}

const CaseTypeMatrix = ({ cashier, selected }: Props) => {
  const dispatch = useAppDispatch();
  const { rollupRows, windows } = useAppSelector((s) => s.lpActions);

  const theirs = buildStandings(rollupRows, windows.length)
    .filter(
      (s) =>
        s.storeid === cashier.storeid &&
        s.cashierNumber === cashier.cashierNumber,
    )
    .sort((a, b) => b.total - a.total);

  if (theirs.length === 0 || windows.length === 0) return null;

  const names = theirs.map((s) => s.saleType);
  const allWeeks = Array(windows.length).fill(0) as number[];
  for (const s of theirs) s.weeks.forEach((n, i) => (allWeeks[i] += n));
  const allTotal = theirs.reduce((a, s) => a + s.total, 0);
  const allValue = theirs.reduce((a, s) => a + s.totalSales, 0);

  const th =
    "px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 bg-gray-50 border-b border-[#1e2a4a]/15 whitespace-nowrap";
  const td = "px-3 py-2 border-b border-[#1e2a4a]/15 text-[13px] tabular-nums";

  return (
    <div className="border-t border-[#1e2a4a]/15">
      <div className="flex items-baseline gap-2 px-4 py-2.5">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
          Everything they rang
        </span>
        <span className="flex-1" />
        <span className="text-[12px] text-content/85">
          pick a row to re-point the case — marked cells beat their own earlier
          weeks
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${th} text-left`}>Exception</th>
            {windows.map((w) => (
              <th key={w.start} className={`${th} text-right`}>
                {formatDateSimple(w.start)}
              </th>
            ))}
            <th className={`${th} text-right`}>Total</th>
            <th className={`${th} text-right`}>Value</th>
          </tr>
        </thead>
        <tbody>
          {theirs.map((s) => {
            const on = s.saleType === selected;
            return (
              <tr
                key={s.saleType}
                onClick={() =>
                  dispatch(
                    setLpCase({
                      ref: cashier,
                      type: s.saleType,
                      // Deliberately omitted: the week is scope, and the
                      // reader picked it. Switching what they are reading
                      // about should not move them to a different week.
                    }),
                  )
                }
                title={`Read this case about ${s.saleType}`}
                className={`cursor-pointer transition-colors ${
                  on ? "bg-row_selected" : "hover:bg-gray-50"
                }`}
              >
                <td
                  className={`${td} text-left border-l-2 ${
                    on ? "border-row_selected_border" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: colourFor(names, s.saleType) }}
                    />
                    <span
                      className={`min-w-0 truncate text-[13px] text-content ${
                        on ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {s.saleType}
                    </span>
                  </div>
                </td>

                {s.weeks.map((n, i) => {
                  // Their own normal, and it excludes the graded week — a
                  // baseline containing the spike is inflated by the very
                  // thing it exists to measure.
                  const hot = n > s.priorPerWeek && n > 0;
                  return (
                    <td
                      key={windows[i]?.start ?? i}
                      title={
                        hot
                          ? `${n} — above their own ${s.priorPerWeek.toFixed(1)} a week`
                          : undefined
                      }
                      className={`${td} text-right ${
                        hot
                          ? "bg-severity_critical_bg text-severity_critical_text font-semibold"
                          : n === 0
                            ? "text-content/85"
                            : "text-content"
                      }`}
                    >
                      {n}
                    </td>
                  );
                })}

                <td className={`${td} text-right font-semibold text-content`}>
                  {s.total}
                </td>
                <td className={`${td} text-right text-content/85`}>
                  {formatCurrency2(s.totalSales)}
                </td>
              </tr>
            );
          })}
        </tbody>

        {theirs.length > 1 && (
          <tfoot>
            <tr className="bg-gray-50">
              <td
                className={`${td} text-left font-semibold text-content border-b-0 border-l-2 border-transparent`}
              >
                All exceptions
              </td>
              {allWeeks.map((n, i) => (
                <td
                  key={windows[i]?.start ?? i}
                  className={`${td} text-right font-semibold text-content border-b-0`}
                >
                  {n}
                </td>
              ))}
              <td
                className={`${td} text-right font-semibold text-content border-b-0`}
              >
                {allTotal}
              </td>
              <td
                className={`${td} text-right font-semibold text-content border-b-0`}
              >
                {formatCurrency2(allValue)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default CaseTypeMatrix;
