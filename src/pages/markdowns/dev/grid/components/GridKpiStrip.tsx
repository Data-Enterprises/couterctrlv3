// Hooks
import { useMemo } from "react";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { markdownTotals } from "../utils";

// Interfaces
import type { MarkdownItem } from "../../../../../interfaces/markdowns";

// Components
import GridKpi from "./GridKpi";

interface GridKpiStripProps {
  /** The rows the filters keep. */
  rows: MarkdownItem[];
}

/** The figures above the grid, for the rows the filters keep. */
const GridKpiStrip = ({ rows }: GridKpiStripProps) => {
  const t = useMemo(() => markdownTotals(rows), [rows]);
  return (
    <div
      data-help="kpis"
      className="grid grid-cols-5 divide-x divide-brand_navy/15 border-b border-brand_navy/15 bg-gray-50 flex-shrink-0"
    >
      <GridKpi label="Markdowns" value={t.lines.toLocaleString()} />
      <GridKpi label="Items" value={t.items.toLocaleString()} />
      <GridKpi label="Markdown $" value={formatCurrency2(t.dollars)} />
      <GridKpi
        label="Avg MD %"
        value={t.avgPct === null ? "—" : `${t.avgPct.toFixed(1)}%`}
      />
      <GridKpi label="Waste $" value={formatCurrency2(t.waste)} />
    </div>
  );
};

export default GridKpiStrip;
