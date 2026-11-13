// Hooks
import { useMemo, useState } from "react";
import { useSalesCtx } from "../../../hooks";

// Utils
import { copyToClipboard } from "../../../../../../components-dev/utils";
import { downloadCsv, rowsToCsv } from "../../../../../../utils/csvExport";
import { listLabel, listNames, nextItemSort, sortItems } from "../utils";
import {
  SLIDE_OPEN,
  SLIDE_SHUT,
  compareFileName,
  csvHeaders,
  csvRows,
  rowOf,
  totalsOf,
  weekBars,
} from "./utils";

// Interfaces
import type { ItemSortState } from "../interfaces";
import type { CompareInput } from "./interfaces";

// Components
import CompareHeader from "./components/CompareHeader";
import CompareList from "./components/CompareList";
import CompareWeekBar from "./components/CompareWeekBar";

interface CompareSlideOverProps {
  open: boolean;
  onClose: () => void;
  onClearA: () => void;
  deptName: string;
  a: CompareInput;
  b: CompareInput;
  twDateLabel: string;
}

/**
 * Two lists of the open department side by side: the pinned list (A) against
 * the filters showing now (B). Slides in over the store panel's report tabs
 * and their content (its containing block is StoreDetailPopup's tab area), so
 * only the KPIs and day cards stay above it; × slides it back.
 */
const CompareSlideOver = ({ open, onClose, onClearA, deptName, a, b, twDateLabel }: CompareSlideOverProps) => {
  const { gradingMetric: metric, selection } = useSalesCtx();
  // One sort for both lists, set from either list's headings.
  const [sort, setSort] = useState<ItemSortState>({ column: "ty", direction: "desc" });

  const names = listNames(a.filter, b.filter);
  const aLabel = listLabel(a.filter);
  const bLabel = listLabel(b.filter);
  const aTotals = useMemo(() => totalsOf(a.items, metric), [a.items, metric]);
  const bTotals = useMemo(() => totalsOf(b.items, metric), [b.items, metric]);
  const aRows = useMemo(() => sortItems(a.items, sort).map((i) => rowOf(i, metric)), [a.items, sort, metric]);
  const bRows = useMemo(() => sortItems(b.items, sort).map((i) => rowOf(i, metric)), [b.items, sort, metric]);
  const bars = weekBars(aTotals, bTotals, metric, names);

  // One sortable table: both lists in the panel's order, then their totals.
  const exportCsv = () =>
    downloadCsv(
      rowsToCsv(
        csvHeaders(metric),
        csvRows([
          { side: "A", label: aLabel, rows: aRows, totals: aTotals },
          { side: "B", label: bLabel, rows: bRows, totals: bTotals },
        ]),
      ),
      compareFileName(selection?.storeName ?? "", deptName, twDateLabel),
    );

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-0 z-20 flex flex-col bg-custom-white shadow-lg transition-[transform,visibility] duration-200 ${open ? SLIDE_OPEN : SLIDE_SHUT}`}
    >
      <CompareHeader
        title={`Comparing ${names[0]} to ${names[1]}`}
        canExport={aRows.length + bRows.length > 0}
        onExport={exportCsv}
        onClearA={onClearA}
        onClose={onClose}
      />

      <div className="grid grid-cols-3 gap-5 px-4 py-2 border-b border-line_hair flex-shrink-0">
        {bars.map((bar) => (
          <CompareWeekBar key={bar.label} bar={bar} />
        ))}
      </div>

      <div className="grid grid-cols-2 grid-rows-[minmax(0,1fr)] gap-6 px-4 pt-2 pb-2.5 flex-1 min-h-0">
        <CompareList
          side="A"
          label={aLabel}
          rows={aRows}
          totals={aTotals}
          sort={sort}
          onSort={(c) => setSort((prev) => nextItemSort(prev, c))}
          onCopy={() => copyToClipboard(aRows.map((r) => r.upc))}
          metric={metric}
        />
        <CompareList
          side="B"
          label={bLabel}
          rows={bRows}
          totals={bTotals}
          sort={sort}
          onSort={(c) => setSort((prev) => nextItemSort(prev, c))}
          onCopy={() => copyToClipboard(bRows.map((r) => r.upc))}
          metric={metric}
        />
      </div>
    </div>
  );
};

export default CompareSlideOver;
