// Hooks
import { useEffect, useMemo, useState } from "react";
import { useSalesCtx } from "../../../hooks";

// Utils
import { copyToClipboard } from "../../../../../../components-dev/utils";
import { downloadCsv, rowsToCsv } from "../../../../../../utils/csvExport";
import { listLabel, listNames } from "../utils";
import {
  BUCKETS,
  SLIDE_OPEN,
  SLIDE_SHUT,
  bucketCells,
  bucketItems,
  compareFileName,
  csvHeaders,
  csvRows,
  driverOf,
  footLine,
  rowOf,
  salesRows,
  standRows,
  totalsOf,
  verdictOf,
} from "./utils";

// Interfaces
import type { Bucket, BucketCell, CompareInput, CompareTotals } from "./interfaces";

// Components
import CompareBucketItems from "./components/CompareBucketItems";
import CompareFooter from "./components/CompareFooter";
import CompareHeader from "./components/CompareHeader";
import CompareSalesTable from "./components/CompareSalesTable";
import CompareStandTable from "./components/CompareStandTable";
import CompareVerdict from "./components/CompareVerdict";

interface CompareSlideOverProps {
  open: boolean;
  onClose: () => void;
  /** Puts these items in the item list, named for the tab they came from. */
  onShow: (label: string, upcs: string[]) => void;
  deptName: string;
  a: CompareInput;
  b: CompareInput;
  twDateLabel: string;
  threshold: number;
}

/**
 * A drawer over the Insight panel that diagnoses two lists of the open
 * department: the pinned list (A) against the filters showing now (B). The
 * verdict, their sales, where their items stand, and the items behind each.
 */
const CompareSlideOver = ({ open, onClose, onShow, deptName, a, b, twDateLabel, threshold }: CompareSlideOverProps) => {
  const { gradingMetric: metric, selection } = useSalesCtx();

  const names = listNames(a.filter, b.filter);
  const labels = [listLabel(a.filter), listLabel(b.filter)];
  const aRows = useMemo(() => a.items.map((i) => rowOf(i, metric)), [a.items, metric]);
  const bRows = useMemo(() => b.items.map((i) => rowOf(i, metric)), [b.items, metric]);
  const totals: [CompareTotals, CompareTotals] = [totalsOf(a.items, metric), totalsOf(b.items, metric)];
  const cells: [Record<Bucket, BucketCell>, Record<Bucket, BucketCell>] = [bucketCells(aRows), bucketCells(bRows)];
  const verdict = verdictOf(cells);

  // Opens on the bucket behind A's verdict (else B's), and again for a new pair.
  // Keyed on the labels: the filter objects are rebuilt on every render.
  const lead: Bucket = driverOf(cells[0]) ?? driverOf(cells[1]) ?? "less";
  const [tab, setTab] = useState<Bucket>(lead);
  useEffect(() => {
    if (open) setTab(lead);
  }, [open, labels[0], labels[1]]);

  const items = bucketItems(aRows, bRows, tab);
  const counts = Object.fromEntries(BUCKETS.map((x) => [x.key, cells[0][x.key].count + cells[1][x.key].count])) as Record<Bucket, number>;
  const tabName = BUCKETS.find((x) => x.key === tab)?.tab ?? "";

  // One sortable table: both lists with where each item stands, then totals.
  const exportCsv = () =>
    downloadCsv(
      rowsToCsv(
        csvHeaders(metric),
        csvRows([
          { side: "A", label: labels[0], rows: aRows, totals: totals[0] },
          { side: "B", label: labels[1], rows: bRows, totals: totals[1] },
        ]),
      ),
      compareFileName(selection?.storeName ?? "", deptName, twDateLabel),
    );

  return (
    <div aria-hidden={!open} className={`absolute inset-0 z-20 ${open ? "visible" : "invisible"}`}>
      {/* What the drawer covers blurs (never darkens); a click on it closes the drawer. */}
      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        aria-label="Compare two lists"
        className={`absolute top-0 right-0 bottom-0 w-[600px] max-w-full flex flex-col bg-custom-white shadow-lg transition-[transform,visibility] duration-200 ${open ? SLIDE_OPEN : SLIDE_SHUT}`}
      >
        <CompareHeader
          deptName={deptName}
          names={names}
          counts={[totals[0].count, totals[1].count]}
          canExport={aRows.length + bRows.length > 0}
          onExport={exportCsv}
          onClose={onClose}
        />

        {/* Scrolls when the drawer is short, so the footer never covers the tabs. */}
        <div className="cc-scroll flex flex-col gap-3 px-4 pt-3 pb-1">
          <CompareVerdict verdict={verdict} names={names} />
          <CompareSalesTable rows={salesRows(totals[0], totals[1], metric)} names={names} threshold={threshold} />
          <CompareStandTable rows={standRows(cells, [totals[0].count, totals[1].count], metric)} />
          <CompareBucketItems counts={counts} open={tab} onOpen={setTab} items={items} metric={metric} />
        </div>

        <CompareFooter
          line={footLine(items, names)}
          count={items.length}
          onCopy={() => copyToClipboard(items.map((i) => i.row.upc))}
          onShow={() => onShow(`${tabName} | ${names[0]} and ${names[1]}`, items.map((i) => i.row.upc))}
        />
      </aside>
    </div>
  );
};

export default CompareSlideOver;
