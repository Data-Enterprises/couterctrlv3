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
  bucketHead,
  bucketItems,
  compareFileName,
  csvHeaders,
  csvRows,
  leadBucket,
  netVsLw,
  rowOf,
  salesRows,
  signed,
  standRows,
  totalsOf,
  verdictCta,
  verdictOf,
} from "./utils";

// Interfaces
import type { Bucket, BucketCell, CompareInput, CompareTotals } from "./interfaces";

// Components
import Carousel from "../../../components/Carousel";
import CompareBucketHead from "./components/CompareBucketHead";
import CompareBucketSlide from "./components/CompareBucketSlide";
import CompareHeader from "./components/CompareHeader";
import CompareSalesTable from "./components/CompareSalesTable";
import CompareStandTable from "./components/CompareStandTable";
import InsightToggle from "../../../components/InsightToggle";

interface CompareSlideOverProps {
  open: boolean;
  onClose: () => void;
  deptName: string;
  a: CompareInput;
  b: CompareInput;
  twDateLabel: string;
  threshold: number;
}

/**
 * A panel over the store panel's report tabs and their content that diagnoses
 * two lists of the open department: the pinned list (A) against the filters
 * showing now (B). On the left, mirrored about its centre (A always left, B
 * always right): the verdict, sales and where the items stand. On the right,
 * each bucket's items in the carousel. Flat, no cards.
 */
const CompareSlideOver = ({ open, onClose, deptName, a, b, twDateLabel, threshold }: CompareSlideOverProps) => {
  const { gradingMetric: metric, selection } = useSalesCtx();

  const names = listNames(a.filter, b.filter);
  const labels = [listLabel(a.filter), listLabel(b.filter)];
  const aRows = useMemo(() => a.items.map((i) => rowOf(i, metric)), [a.items, metric]);
  const bRows = useMemo(() => b.items.map((i) => rowOf(i, metric)), [b.items, metric]);
  const totals: [CompareTotals, CompareTotals] = [totalsOf(a.items, metric), totalsOf(b.items, metric)];
  const counts: [number, number] = [totals[0].count, totals[1].count];
  const cells: [Record<Bucket, BucketCell>, Record<Bucket, BucketCell>] = [bucketCells(aRows), bucketCells(bRows)];
  const nets = [netVsLw(cells[0]), netVsLw(cells[1])];
  const insight = verdictCta(verdictOf(cells, counts), names);
  // The insight line opens over the panel, as on the other tabs; it starts shut.
  const [insightOpen, setInsightOpen] = useState(false);

  // Opens on A's problem (else B's), and again for a new pair.
  // Keyed on the labels: the filter objects are rebuilt on every render.
  const lead: Bucket = leadBucket(cells[0]) ?? leadBucket(cells[1]) ?? "less";
  const [tab, setTab] = useState<Bucket>(lead);
  useEffect(() => {
    if (open) setTab(lead);
  }, [open, labels[0], labels[1]]);

  const items = bucketItems(aRows, bRows, tab);
  const at = BUCKETS.findIndex((x) => x.key === tab);
  const slides = BUCKETS.map((x) => ({
    label: x.tab,
    count: cells[0][x.key].count + cells[1][x.key].count,
    body: <CompareBucketSlide items={bucketItems(aRows, bRows, x.key)} metric={metric} />,
  }));

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
    <aside
      aria-hidden={!open}
      aria-label="Compare two lists"
      className={`absolute inset-0 z-20 flex flex-col bg-custom-white shadow-lg transition-[transform,visibility] duration-200 ${open ? SLIDE_OPEN : SLIDE_SHUT}`}
    >
      <CompareHeader
        deptName={deptName}
        names={names}
        counts={counts}
        canExport={aRows.length + bRows.length > 0}
        onExport={exportCsv}
        onClose={onClose}
      />
      <InsightToggle
        name={insight.name}
        cta={insight.cta}
        open={insightOpen}
        onToggle={() => setInsightOpen((v) => !v)}
      />

      <div className="grid grid-cols-[470px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] flex-1 min-h-0">
        {/* The diagnosis, mirrored: scrolls on its own when the panel is short. */}
        <section className="cc-scroll flex flex-col px-4 pt-1 pb-4 border-r border-line_hair">
          <CompareSalesTable rows={salesRows(totals[0], totals[1], metric)} threshold={threshold} />
          <CompareStandTable
            names={names}
            rows={standRows(cells, metric)}
            net={[
              { text: signed(nets[0], metric), down: nets[0] < 0 },
              { text: signed(nets[1], metric), down: nets[1] < 0 },
            ]}
            open={tab}
            onOpen={setTab}
          />
        </section>

        {/* Each bucket's items, one slide each; a row on the left turns it. */}
        <div className="min-h-0 pt-1">
          <Carousel
            bare
            slides={slides}
            at={at}
            onAt={(i) => setTab(BUCKETS[i].key)}
            fill
            helpAnchor="compare-items"
            above={
              <CompareBucketHead
                text={bucketHead(tab, items.length)}
                count={items.length}
                onCopy={() => copyToClipboard(items.map((i) => i.row.upc))}
              />
            }
          />
        </div>
      </div>
    </aside>
  );
};

export default CompareSlideOver;
