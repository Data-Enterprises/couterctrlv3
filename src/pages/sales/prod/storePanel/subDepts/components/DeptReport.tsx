// Hooks
import { useMemo, useState } from "react";
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx, useSalesState } from "../../../hooks";
import { useCounterpartSubs } from "../hooks";

// Redux
import { setInvestigation } from "../../../../../../features/salesLedgerSlice";

// Utils
import {
  buildReport,
  hashTotals,
  totalsFrom,
  type ReportRow,
} from "../../../utils/deptReport";
import { LIST_COLS } from "../utils";

// Components
import LoadingIndicator from "../../../../../../components/loading/LoadingIndicator";
import DeptCompareHeader from "./DeptCompareHeader";
import ListRow from "./ListRow";
import Detail from "./Detail";

interface DeptReportProps {
  openStoreName: string;
  /** The investigation is about one named store's supply chain, so it cannot
   *  work from the name alone. */
  openStoreId: number;
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
   * The open store's LW and LY are already narrowed to these on the way into
   * the slice; the counterpart has to be narrowed to the same set.
   */
  lwWeekDates: string[];
  lyWeekDates: string[];
  onBack: () => void;
}

/**
 * The sub-department comparison, read as a report.
 *
 * Shown only when a counterpart has been chosen in Stores — without one the
 * tab stays the store's own graded departments, which is a different question
 * and already answered.
 *
 * One line a department: what it is, what it costs, what went wrong, and the
 * button that goes and looks. Under each, the three gates in order with the
 * failing one marked, so the sentence is a claim with its working shown
 * rather than an assertion to take on trust.
 *
 * There is nothing to expand. An earlier pass hid a tray of figures behind
 * every row and it read as a pile — three sub-tables in three shapes, each
 * re-declaring its own headers, with the finding competing against them for
 * the eye. The trail of checks IS the evidence, and it fits on one line.
 *
 * Every figure comes from rows already fetched. Nothing item-level appears
 * here — that costs nine requests a department and is the investigation's
 * whole job. The report NAMES a diagnosis; the investigation proves it.
 */
const DeptReport = ({
  openStoreName,
  openStoreId,
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
}: DeptReportProps) => {
  const { selectedDate } = useSalesCtx();
  const dispatch = useAppDispatch();
  // The open store's three weeks are already here — the panel fetched them
  // for its own Sub dept tab, which is why only the counterpart is asked for.
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();
  const { theirs, failed } = useCounterpartSubs({
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
  /** The department the panel is showing, by its matched key — not by a
   *  store's own number, which means different things at each store. */
  const [picked, setPicked] = useState<string | null>(null);

  /** What both stores leave out of net sales, for the note under the bar. */
  const hash = useMemo(
    () =>
      theirs
        ? hashTotals({
            mineTw: subSales,
            mineLw: subSalesWk2,
            mineLy: subSalesWk3,
            theirsTw: theirs.tw,
            theirsLw: theirs.lw,
            theirsLy: theirs.ly,
          })
        : null,
    [theirs, subSales, subSalesWk2, subSalesWk3],
  );

  const report = useMemo(() => {
    if (!theirs) return null;
    return buildReport(
      totalsFrom({
        mineTw: subSales,
        mineLw: subSalesWk2,
        mineLy: subSalesWk3,
        theirsTw: theirs.tw,
        theirsLw: theirs.lw,
        theirsLy: theirs.ly,
      }),
    );
  }, [theirs, subSales, subSalesWk2, subSalesWk3]);

  /** Both stores travel with it: the question there is why THIS store is
   *  behind THAT one in this department. The gate that failed travels too,
   *  so the investigation can mark the pile it points at. */
  const investigate = (row: ReportRow) =>
    dispatch(
      setInvestigation({
        storeid: openStoreId,
        storeNumber: openStoreNumber,
        storeName: openStoreName,
        compareStoreid: compareStoreId,
        compareStoreNumber,
        compareStoreName,
        subDept: row.mineId ?? 0,
        // The counterpart's own number for the same department. The two
        // stores do not agree on it; the report paired them by name.
        compareSubDept: row.theirsId ?? 0,
        subDeptName: row.name,
        focus: row.chain.focus,
      }),
    );

  if (failed) {
    return (
      <div className="h-full flex items-center justify-center px-4 text-center text-[12.5px] text-content/95">
        That store&rsquo;s departments could not be loaded.
      </div>
    );
  }
  if (!report) {
    return (
      <div className="relative h-full">
        <LoadingIndicator message="Loading departments" />
      </div>
    );
  }

  const { shown, folded, over } = report;

  /**
   * Every department, worst first.
   *
   * The cut still does its work — it decides what the headline counts and
   * what the bar draws — but it no longer decides what is on screen. A
   * department folded away is one somebody has to take on trust, and with
   * a panel sitting beside the list there is room to show all of them.
   */
  const rows = [...shown, ...folded, ...over].sort((x, y) => x.gap - y.gap);

  /** The first row until somebody picks another, so the panel is never
   *  empty and never opens on a department nobody chose. */
  const selected = rows.find((r) => r.key === picked) ?? rows[0] ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <DeptCompareHeader
        report={report}
        hash={hash}
        compareStoreName={compareStoreName}
        onBack={onBack}
      />

      {/* The same two panels the single-store tab uses: a list to scan, and
          the thing it points at. One row of evidence could never carry a
          name, a figure, a sentence, a button and three gates across a full
          width — split in two, each half has room to be read. */}
      <div className="flex-1 min-h-0 flex">
        <div
          className="flex flex-col min-h-0 border-r border-brand_navy/15"
          style={{ width: "39.5%" }}
        >
          <div
            className="flex-shrink-0 grid items-center gap-2 px-3 py-1.5 border-b border-brand_navy/15 text-[10px] font-bold uppercase tracking-wide text-content/95"
            style={{ gridTemplateColumns: LIST_COLS }}
          >
            <span />
            <span className="min-w-0">Sub dept</span>
            {/* "Gap" was unambiguous while it was the only one. */}
            <span className="text-right">Sales gap</span>
            <span className="text-right">Units</span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
            {rows.map((r) => (
              <ListRow
                key={r.key}
                row={r}
                selected={selected?.key === r.key}
                onSelect={() => setPicked(r.key)}
              />
            ))}
          </div>
        </div>

        {selected ? (
          <Detail
            row={selected}
            us={openStoreName}
            them={compareStoreName}
            day={selectedDate}
            onInvestigate={investigate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center px-4 text-center text-[12.5px] text-content/95">
            No departments to compare.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeptReport;
