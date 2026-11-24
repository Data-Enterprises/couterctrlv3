// Components
import Kpi from "./Kpi";

interface DetailKpiStripProps {
  isQty: boolean;
  labels: { twLabel: string; lwLabel: string; lyLabel: string };
  /** The three figures, already formatted. */
  twText: string;
  lwText: string;
  lyText: string;
  lwPct: number | null;
  lyPct: number | null;
  lwComplete: boolean;
  lyComplete: boolean;
  lwCoverageNote: string | undefined;
  lyCoverageNote: string | undefined;
  threshold: number;
}

/** The KPI strip: this week (or day), and against last week and last year,
 *  with their date lines. */
const DetailKpiStrip = ({
  isQty,
  labels,
  twText,
  lwText,
  lyText,
  lwPct,
  lyPct,
  lwComplete,
  lyComplete,
  lwCoverageNote,
  lyCoverageNote,
  threshold,
}: DetailKpiStripProps) => (
  <div className="grid grid-cols-3 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
    <Kpi
      title={isQty ? "TY Qty" : "TY Net Sales"}
      dateLabel={labels.twLabel}
      value={twText}
      threshold={threshold}
    />
    <Kpi
      title="vs Last Week"
      dateLabel={labels.lwLabel}
      value={lwText}
      pct={lwPct}
      complete={lwComplete}
      coverageNote={lwCoverageNote}
      threshold={threshold}
    />
    <Kpi
      title="vs Last Year"
      dateLabel={labels.lyLabel}
      value={lyText}
      pct={lyPct}
      complete={lyComplete}
      coverageNote={lyCoverageNote}
      threshold={threshold}
    />
  </div>
);

export default DetailKpiStrip;
