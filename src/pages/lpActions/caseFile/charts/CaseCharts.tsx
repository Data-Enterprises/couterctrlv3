import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { toggleLpFacet } from "../../../../features/lpActionsSlice";
import { inSubject } from "../../lpActionsMetrics";
import { useCaseReceipts } from "../../case/useCaseReceipts";
import { buildTypeScopes } from "../caseScopes";
import StackedBarChart from "./StackedBarChart";
import ChartCard from "./ChartCard";
import { HOUR_INFO, DOW_INFO } from "./chartsInfo";
import { byWeekday, byHour, stackOrder } from "./chartsModel";
import type { CaseFile } from "../caseFileModel";

/**
 * When the exceptions happen: which day, and what time of day.
 *
 * Two cuts, not three. A per-shift timeline of the latest week was here and
 * came out — it answered the same question as the weekday chart in a shape
 * this audience does not read things in, and it was the only view on the tab
 * scoped to one week while everything beside it spanned the whole walk. Both
 * charts now cover the same span, so a reader can put them side by side
 * without silently comparing different periods.
 *
 * **Selecting a card isolates both charts to that type.** Once someone has
 * named the type they care about, the other bands are in the way of the shape
 * they came for. Deselecting brings the stack back; the bins and the axis are
 * otherwise identical, so it is the same chart with the noise removed.
 *
 * Both charts count EVERY walked week, not just the latest — a habit only
 * shows across weeks, and one week of a day-of-week chart is seven columns of
 * one day each. The cards above them are the latest week alone, so each chart
 * says its span on its face; the two answering different periods without
 * saying so is exactly the confusion this note exists to stop.
 *
 * No legend. Every colour on these charts is already named on a card directly
 * above them, with its count — a third telling of the same key was spending a
 * row to repeat what the reader had just scrolled past.
 *
 * The hour chart is the one piece here that waits on a read — the walked row
 * carries no time, only the receipt line does. It starts as soon as a case
 * opens rather than when someone reaches the evidence tab, so by the time they
 * do, it is cached.
 */
interface Props {
  file: CaseFile;
}

const CaseCharts = ({ file }: Props) => {
  const dispatch = useAppDispatch();
  const { rawRows, windows, caseSubject, focusedType, focusedWeek, facets } =
    useAppSelector((s) => s.lpActions);

  const scopes = useMemo(
    () => buildTypeScopes(rawRows, caseSubject),
    [rawRows, caseSubject],
  );
  const receipts = useCaseReceipts(scopes);

  const mine = useMemo(
    () =>
      caseSubject === null
        ? []
        : rawRows.filter((r) => inSubject(r, caseSubject)),
    [rawRows, caseSubject],
  );

  /** Only types this operator actually touched get a series. A legend listing
   *  four zeroes is noise; the zero CARDS above already make that point, in
   *  the one place it reads as an answer. */
  const touched = useMemo(
    () =>
      stackOrder(file.cards.filter((c) => c.count > 0).map((c) => c.saleType)),
    [file.cards],
  );

  /** One type when a card is selected, every type otherwise. */
  const drawn = useMemo(
    () =>
      focusedType && touched.includes(focusedType) ? [focusedType] : touched,
    [focusedType, touched],
  );

  /** The week the charts count, or null for the whole walk. */
  const window =
    focusedWeek !== null ? (windows[focusedWeek] ?? null) : null;

  const weekday = useMemo(
    () => byWeekday(mine, drawn, window),
    [mine, drawn, window],
  );

  /**
   * The picked day, shared with the evidence rail rather than held here.
   *
   * Clicking a column IS setting the day-of-week filter, so it sets the same
   * one — which means the hours narrow immediately, and switching to Evidence
   * arrives already cut to that day instead of asking for the choice twice.
   * One selection only: a chart column is a single answer, and the rail is
   * where several days get combined.
   */
  const pickedDay = facets.dow?.length === 1 ? facets.dow[0] : null;

  const hours = useMemo(
    () => byHour(receipts.lines, drawn, pickedDay, window),
    [receipts.lines, drawn, pickedDay, window],
  );

  /** What the charts are counting, said on their face. */
  const span = window
    ? `week ending ${window.end.slice(5)}`
    : `all ${windows.length} weeks`;

  if (touched.length === 0) return null;

  return (
    /* `min-h`, not `min-h-0`: in a scrolling flex column a shrinkable child
       can be handed zero height on a short window, and the charts would
       disappear rather than the panel scrolling. With a floor the column
       overflows instead, which is the behaviour that can be scrolled out of. */
    <div className="flex-1 min-h-[300px] flex flex-col gap-2.5">
      {/* `auto-rows-fr` so the two share the height evenly whether they sit
          side by side or wrap onto two rows. */}
      <div className="flex-1 min-h-0 grid gap-2.5 auto-rows-fr grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
        <ChartCard info={DOW_INFO} note={span}>
          {(size) => (
            <StackedBarChart
              categories={weekday}
              types={drawn}
              width={size.width}
              height={size.height}
              barWidth={40}
              label="Exceptions by day of week"
              selectedKey={pickedDay}
              onSelect={(key) =>
                dispatch(toggleLpFacet({ key: "dow", value: key }))
              }
            />
          )}
        </ChartCard>

        <ChartCard
          info={HOUR_INFO}
          note={pickedDay ? `${pickedDay}s · ${span}` : span}
          loading={receipts.loading && hours.length === 0}
          empty={
            !receipts.loading && hours.length === 0
              ? (receipts.error ??
                (pickedDay
                  ? `Nothing on a ${pickedDay} in this span.`
                  : "No timed lines came back for this span."))
              : undefined
          }
        >
          {(size) => (
            <StackedBarChart
              categories={hours}
              types={drawn}
              width={size.width}
              height={size.height}
              barWidth={26}
              label="Exceptions by hour of day"
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default CaseCharts;
