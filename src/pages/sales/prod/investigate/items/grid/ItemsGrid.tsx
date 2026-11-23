// Hooks
import { useSalesCtx } from "../../../hooks";
import { useItemsGrid, useRowSelection } from "../../hooks";

// Utils
import { metricFormat } from "../../../utils";
import { COLUMNS } from "../../utils/columns";

// Interfaces
import type { Cause, CauseTotal, ItemVerdict, Stage } from "../../interfaces";

// Components
import GridContextMenu from "./components/GridContextMenu";
import GridFoot from "./components/GridFoot";
import GridHeadCell from "./components/GridHeadCell";
import GridPager from "./components/GridPager";
import GridRow from "./components/GridRow";

interface ItemsGridProps {
  items: ItemVerdict[];
  stage: Stage;
  allIn: boolean;
  byCause: Map<Cause, CauseTotal>;
  /** Find the right-clicked rows in the Supply tab. */
  onOpenSupply: (upcs: string) => void;
}

/** The Items tab's grid: the column heads, a page of item rows and the totals
 *  under them, the pager, and the right-click menu over the picked rows. */
const ItemsGrid = ({
  items,
  stage,
  allIn,
  byCause,
  onOpenSupply,
}: ItemsGridProps) => {
  const { gradingMetric, investigation: target } = useSalesCtx();
  const grid = useItemsGrid(items);
  const { filters, sorted, capped, picked, setPicked, show } = grid;
  const selection = useRowSelection(sorted, picked, setPicked, show);
  const { chosen, ctx, setCtx } = selection;

  const fmt = metricFormat(gradingMetric === "qty");

  if (!target) return null;

  return (
    <>
      <div
        data-help="grid"
        className="flex-1 min-w-0 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
          <table className="border-collapse font-mono text-[11px] w-max">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 w-[44px] bg-bkg border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5"></th>
                {COLUMNS.map((c) => (
                  <GridHeadCell
                    key={c.key}
                    column={c}
                    target={target}
                    filters={filters}
                    byCause={byCause}
                    sort={grid.sort}
                    onSort={grid.handleSort}
                  />
                ))}
              </tr>
            </thead>

            {/* No zebra stripe: every cell is ruled, which is what separates
                the rows here, and the sticky number column is opaque white —
                a stripe would stop dead under it. */}
            <tbody>
              {capped.map((r, i) => (
                <GridRow
                  key={r.productCode}
                  row={r}
                  n={i + 1}
                  selection={selection}
                  allIn={allIn}
                  fmt={fmt}
                />
              ))}
            </tbody>

            {capped.length > 0 && <GridFoot shown={filters.shown} fmt={fmt} />}
          </table>

          {capped.length === 0 && stage !== "sales" && (
            <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
              Nothing in this department to compare.
            </div>
          )}
        </div>

        {sorted.length > 0 && (
          <GridPager
            sorted={sorted}
            items={items}
            chosen={chosen}
            from={grid.from}
            page={grid.at_}
            pages={grid.pages}
            setPage={grid.setPage}
          />
        )}
      </div>

      {ctx && (
        <GridContextMenu
          ctx={ctx}
          shown={filters.shown}
          chosen={chosen}
          onFind={onOpenSupply}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  );
};

export default ItemsGrid;
