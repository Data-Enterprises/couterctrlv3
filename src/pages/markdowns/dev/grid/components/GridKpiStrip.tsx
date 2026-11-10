// Hooks
import { useCallback, useMemo, useState } from "react";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { markdownTotals } from "../utils";

// Interfaces
import type { MarkdownItem } from "../../../../../interfaces/markdowns";

// Components
import GridKpi from "./GridKpi";
import GridStoresOverlay from "./GridStoresOverlay";

interface GridKpiStripProps {
  /** The rows the filters keep. */
  rows: MarkdownItem[];
}

/** The figures above the grid, for the rows the filters keep. Stores opens
 *  the list of them over the grid. */
const GridKpiStrip = ({ rows }: GridKpiStripProps) => {
  const t = useMemo(() => markdownTotals(rows), [rows]);
  const [storesOpen, setStoresOpen] = useState(false);
  const closeStores = useCallback(() => setStoresOpen(false), []);
  return (
    <div className="relative flex-shrink-0">
      <div
        data-help="kpis"
        className="grid grid-cols-5 divide-x divide-brand_navy/15 border-b border-brand_navy/15 bg-gray-50"
      >
        <GridKpi
          label="Stores"
          value={t.stores.length.toLocaleString()}
          onClick={() => setStoresOpen((v) => !v)}
          open={storesOpen}
        />
        <GridKpi label="Markdown $" value={formatCurrency2(t.dollars)} />
        <GridKpi label="Retail $" value={formatCurrency2(t.retail)} />
        <GridKpi label="Items" value={t.items.toLocaleString()} />
        <GridKpi
          label="Avg MD %"
          value={t.avgPct === null ? "—" : `${t.avgPct.toFixed(1)}%`}
        />
      </div>
      <GridStoresOverlay open={storesOpen} stores={t.stores} onClose={closeStores} />
    </div>
  );
};

export default GridKpiStrip;
