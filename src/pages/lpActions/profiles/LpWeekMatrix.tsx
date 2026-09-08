import { useAppDispatch, useAppSelector } from "../../../hooks";
import { toggleLpQuiet } from "../../../features/lpActionsSlice";
import { formatCurrency2, formatDateSimple } from "../../../utils";
import { severityDotClass, type Severity } from "../../../utils/severity";
import {
  bandOf,
  buildStandings,
  distanceOf,
  type Band,
  type CashierStanding,
} from "./rollupStats";

/**
 * Every cashier at this store, every week, as one grid.
 *
 * The four sections above summarise; this is the thing they summarise. Call 1
 * already holds the whole population at cashier-week grain — the sections
 * beside it can only speak for the cashiers call 2 returned, which is the
 * flagged ones — so this is the only view on the page that shows a store's
 * quiet weeks and quiet people at all. Without it a store with two flagged
 * cashiers has a report about two people and says nothing about the other
 * eleven.
 *
 * A table because the reader lives in spreadsheets. Counts down a column,
 * weeks across, totals at the bottom: no chart is faster for "which week, and
 * who was on".
 *
 * Two things are marked, and only two, because a grid that tints everything
 * tints nothing:
 *
 *   A CELL above what one cashier at this store rings in an average week. That
 *   is the same line the roster splits on, so a tinted cell and a red dot
 *   cannot disagree.
 *
 *   A VALUE that is high while the count is not. This is the finding the page
 *   exists for and the one every count-based measure misses — a handful of
 *   large refunds reads clean on every column to its left.
 */
interface Props {
  saleType: string;
  storeid: number;
}

const SEV_OF: Record<Band, Severity> = {
  case: "critical",
  word: "watch",
  quiet: "healthy",
};

/** Ordinary count, unusual money. The count columns say nothing about this
 *  row, which is exactly why it is worth marking. */
const valueDiverges = (s: CashierStanding) =>
  s.perWeek <= s.storePerWeek && s.overStoreValue;

const LpWeekMatrix = ({ saleType, storeid }: Props) => {
  const dispatch = useAppDispatch();
  const { rollupRows, windows, quietOpen } = useAppSelector((s) => s.lpActions);

  const all = buildStandings(rollupRows, windows.length)
    .filter((s) => s.storeid === storeid && s.saleType === saleType)
    .sort((a, b) => {
      const order = { case: 0, word: 1, quiet: 2 } as const;
      const d = order[bandOf(a)] - order[bandOf(b)];
      return d !== 0 ? d : distanceOf(b) - distanceOf(a);
    });

  if (all.length === 0 || windows.length === 0) return null;

  const flagged = all.filter((s) => bandOf(s) !== "quiet");
  const quiet = all.filter((s) => bandOf(s) === "quiet");
  const storeAvg = all[0].storePerWeek;

  /** The store's own totals, summed from the same rows the grid prints — so a
   *  reader adding the column gets the footer, every time. */
  const storeWeeks = Array(windows.length).fill(0) as number[];
  for (const s of all) s.weeks.forEach((n, i) => (storeWeeks[i] += n));
  const storeTotal = all.reduce((a, s) => a + s.total, 0);
  const storeValue = all.reduce((a, s) => a + s.totalSales, 0);

  /** Pooled, when the calm ones are collapsed — a count and its weeks, not a
   *  person, so it carries no dot and no value judgement. */
  const quietWeeks = Array(windows.length).fill(0) as number[];
  for (const s of quiet) s.weeks.forEach((n, i) => (quietWeeks[i] += n));
  const quietTotal = quiet.reduce((a, s) => a + s.total, 0);
  const quietValue = quiet.reduce((a, s) => a + s.totalSales, 0);

  const th =
    "px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 bg-gray-50 border-b border-[#1e2a4a]/15 whitespace-nowrap";
  const td = "px-3 py-2 border-b border-[#1e2a4a]/15 text-[13px] tabular-nums";

  const WeekCells = ({ weeks, tint }: { weeks: number[]; tint: boolean }) => (
    <>
      {weeks.map((n, i) => {
        const hot = tint && n > storeAvg;
        return (
          <td
            key={windows[i]?.start ?? i}
            title={
              hot
                ? `${n} — above the store's ${storeAvg.toFixed(1)} per cashier-week`
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
    </>
  );

  const Row = ({ s }: { s: CashierStanding }) => {
    const diverges = valueDiverges(s);
    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className={`${td} text-left`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[SEV_OF[bandOf(s)]]}`}
            />
            <span className="min-w-0 truncate text-[13px] font-medium text-content">
              {s.cashierName}
            </span>
            <span className="flex-shrink-0 text-[12px] text-content/85">
              {s.cashierNumber}
            </span>
          </div>
        </td>
        <WeekCells weeks={s.weeks} tint />
        <td className={`${td} text-right font-semibold text-content`}>
          {s.total}
        </td>
        <td
          title={
            diverges
              ? `${formatCurrency2(s.salesPerWeek)} a week against the store's ${formatCurrency2(s.storeSalesPerWeek)} — the count does not show this`
              : undefined
          }
          className={`${td} text-right ${
            diverges
              ? "bg-severity_watch_bg text-severity_watch_text font-semibold"
              : "text-content/85"
          }`}
        >
          {formatCurrency2(s.totalSales)}
          {diverges && <span className="ml-1 text-[11px]">value</span>}
        </td>
      </tr>
    );
  };

  return (
    <div className="border-t border-[#1e2a4a]/15">
      <div className="flex items-baseline gap-2 px-4 py-2.5">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
          Every cashier, every week
        </span>
        <span className="flex-1" />
        <span className="text-[12px] text-content/85 tabular-nums">
          store average {storeAvg.toFixed(1)} per cashier-week — cells above it
          are marked
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${th} text-left`}>Cashier</th>
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
          {flagged.map((s) => (
            <Row key={`${s.cashierNumber}-${s.saleType}`} s={s} />
          ))}

          {quiet.length > 0 &&
            (quietOpen ? (
              quiet.map((s) => (
                <Row key={`${s.cashierNumber}-${s.saleType}`} s={s} />
              ))
            ) : (
              <tr
                onClick={() => dispatch(toggleLpQuiet())}
                title="Show them individually"
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className={`${td} text-left`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-300" />
                    <span className="text-[13px] text-content/85">
                      {quiet.length} not flagged ▸
                    </span>
                  </div>
                </td>
                {/* Pooled counts get no tint: the line is per cashier, and a
                    sum of three people clears it for reasons that are not a
                    finding about any of them. */}
                <WeekCells weeks={quietWeeks} tint={false} />
                <td className={`${td} text-right font-semibold text-content`}>
                  {quietTotal}
                </td>
                <td className={`${td} text-right text-content/85`}>
                  {formatCurrency2(quietValue)}
                </td>
              </tr>
            ))}

          {quietOpen && quiet.length > 0 && (
            <tr>
              <td
                colSpan={windows.length + 3}
                onClick={() => dispatch(toggleLpQuiet())}
                title="Pool them back into one row"
                className="px-3 py-1.5 border-b border-[#1e2a4a]/15 text-[12px] text-content/85 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                ▾ collapse the {quiet.length} not flagged
              </td>
            </tr>
          )}
        </tbody>

        <tfoot>
          <tr className="bg-gray-50">
            <td
              className={`${td} text-left font-semibold text-content border-b-0`}
            >
              Store
            </td>
            {storeWeeks.map((n, i) => (
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
              {storeTotal}
            </td>
            <td
              className={`${td} text-right font-semibold text-content border-b-0`}
            >
              {formatCurrency2(storeValue)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default LpWeekMatrix;
