// Hooks
import { useMemo, useState } from "react";
import { useSalesCtx } from "../../../hooks";

// Utils
import { copyToClipboard } from "../../../../../../components-dev/utils";
import { downloadCsv, rowsToCsv } from "../../../../../../utils/csvExport";
import {
  SLIDE_OPEN,
  SLIDE_SHUT,
  answerLine,
  compareFileName,
  csvHeaders,
  csvRows,
  rowOf,
  sortRows,
  totalsOf,
  weekBoxes,
} from "./utils";

// Interfaces
import type { CompareInput, CompareSort } from "./interfaces";

// Components
import CompareFooter from "./components/CompareFooter";
import CompareHeader from "./components/CompareHeader";
import CompareList from "./components/CompareList";
import CompareSortBar from "./components/CompareSortBar";
import CompareWeekBox from "./components/CompareWeekBox";

interface CompareSlideOverProps {
  open: boolean;
  onClose: () => void;
  onClearA: () => void;
  deptName: string;
  a: CompareInput;
  b: CompareInput;
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

/**
 * Two lists of the open department side by side: the pinned list (A) against
 * the filters showing now (B). Slides in over the whole right section; × slides
 * it back to the list with the filters as they were.
 */
const CompareSlideOver = ({
  open,
  onClose,
  onClearA,
  deptName,
  a,
  b,
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
}: CompareSlideOverProps) => {
  const { gradingMetric: metric, selection } = useSalesCtx();
  const [sort, setSort] = useState<CompareSort>("ty");

  const aTotals = useMemo(() => totalsOf(a.items, metric), [a.items, metric]);
  const bTotals = useMemo(() => totalsOf(b.items, metric), [b.items, metric]);
  const aRows = useMemo(() => sortRows(a.items.map((i) => rowOf(i, metric)), sort, metric), [a.items, sort, metric]);
  const bRows = useMemo(() => sortRows(b.items.map((i) => rowOf(i, metric)), sort, metric), [b.items, sort, metric]);
  const boxes = weekBoxes(aTotals, bTotals, metric, { tw: twDateLabel, lw: lwDateLabel, ly: lyDateLabel });
  const storeName = selection?.storeName ?? "";

  // One sortable table: both lists in the panel's order, then their totals.
  const exportCsv = () =>
    downloadCsv(
      rowsToCsv(
        csvHeaders(metric),
        csvRows([
          { side: "A", label: a.label, rows: aRows, totals: aTotals },
          { side: "B", label: b.label, rows: bRows, totals: bTotals },
        ]),
      ),
      compareFileName(storeName, deptName, twDateLabel),
    );

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-0 z-20 flex flex-col bg-custom-white shadow-lg transition-[transform,visibility] duration-200 ${open ? SLIDE_OPEN : SLIDE_SHUT}`}
    >
      <CompareHeader deptName={deptName} storeName={storeName} onClose={onClose} />

      <div className="flex flex-col gap-2 px-4 py-2.5 border-b border-line_hair flex-shrink-0">
        <p className="text-[13px] font-semibold text-content leading-snug">
          {answerLine(aTotals, bTotals, metric)}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {boxes.map((box) => (
            <CompareWeekBox key={box.label} label={box.label} dates={box.dates} lines={box.lines} gap={box.gap} />
          ))}
        </div>
      </div>

      <CompareSortBar sort={sort} onSort={setSort} />

      <div className="grid grid-cols-2 grid-rows-[minmax(0,1fr)] gap-4 px-4 py-2 flex-1 min-h-0">
        <CompareList side="A" label={a.label} rows={aRows} totals={aTotals} metric={metric} />
        <CompareList side="B" label={b.label} rows={bRows} totals={bTotals} metric={metric} />
      </div>

      <CompareFooter
        aCount={aRows.length}
        bCount={bRows.length}
        onCopyA={() => copyToClipboard(aRows.map((r) => r.upc))}
        onCopyB={() => copyToClipboard(bRows.map((r) => r.upc))}
        onExport={exportCsv}
        onClearA={onClearA}
      />
    </div>
  );
};

export default CompareSlideOver;
