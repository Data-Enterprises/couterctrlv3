// Utils
import { formatCurrency2 } from "../../../../../utils";
import { fmtAvgPct } from "../utils";

// Interfaces
import type { MarkdownTotals } from "../interfaces";

// Components
import GridKpi from "./GridKpi";

interface GridKpiStripProps {
  /** The figures for the rows the filters keep. */
  totals: MarkdownTotals;
}

/** The figures above the grid, for the rows the filters keep. */
const GridKpiStrip = ({ totals: t }: GridKpiStripProps) => {
  return (
    <div
      data-help="kpis"
      className="grid grid-cols-5 divide-x divide-brand_navy/15 border-b border-brand_navy/15 bg-gray-50 flex-shrink-0"
    >
      <GridKpi label="Markdowns" value={t.lines.toLocaleString()} />
      <GridKpi label="Items" value={t.items.toLocaleString()} />
      <GridKpi label="Markdown $" value={formatCurrency2(t.dollars)} />
      <GridKpi label="Avg MD %" value={fmtAvgPct(t.avgPct)} />
      <GridKpi label="Waste $" value={formatCurrency2(t.waste)} />
    </div>
  );
};

export default GridKpiStrip;
