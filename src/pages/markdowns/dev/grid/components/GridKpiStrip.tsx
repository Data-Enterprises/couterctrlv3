// Hooks
import { useMemo } from "react";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { markdownTotals } from "../utils";

// Interfaces
import type { MarkdownItem } from "../../../../../interfaces/markdowns";

// Components
import GridKpi from "../../../../../components-dev/kpi/GridKpi";
import StoresKpi from "../../../../../components-dev/kpi/StoresKpi";

interface GridKpiStripProps {
  /** The rows the filters keep. */
  rows: MarkdownItem[];
}

/** The figures above the grid, for the rows the filters keep. Stores opens
 *  the list of them. */
const GridKpiStrip = ({ rows }: GridKpiStripProps) => {
  const t = useMemo(() => markdownTotals(rows), [rows]);
  return (
    <div
      data-help="kpis"
      className="grid grid-cols-5 divide-x divide-brand_navy/15 border-b border-brand_navy/15 bg-fill_soft flex-shrink-0"
    >
      <StoresKpi stores={t.stores} />
      <GridKpi label="Markdown $" value={formatCurrency2(t.dollars)} />
      <GridKpi label="Retail $" value={formatCurrency2(t.retail)} />
      <GridKpi label="Items" value={t.items.toLocaleString()} />
      <GridKpi
        label="Avg MD %"
        value={t.avgPct === null ? "—" : `${t.avgPct.toFixed(1)}%`}
      />
    </div>
  );
};

export default GridKpiStrip;
