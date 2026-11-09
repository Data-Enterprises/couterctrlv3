import { useMemo } from "react";
import type { MovementRow } from "../../../../../features/dev/devUpcDevSlice";
import { heatStyle } from "../../utils/heatColor";
import {
  fmtMovement,
  movementGrid,
  shortDate,
  type MovementStore,
} from "./movementStats";

interface Props {
  code: string;
  rows: MovementRow[];
  stores: MovementStore[];
  weekEndings: string[];
}

/**
 * One item, stores down and weeks across, with each store's total on the
 * right and each week's total along the bottom.
 *
 * Every cell is shaded by how much it moved against the busiest cell, on the
 * ramp Sales Comp's day grid uses and in its form: the colour fills the cell
 * as a tile, with a small gutter, and the figure sits centred in it. So the
 * stores carrying an item read at a glance instead of by scanning numbers.
 * That is magnitude, not a grade: blue, never red or green.
 *
 * A store that sold none of it in a week shows a dash rather than 0. A store
 * that sold none at all keeps its row, muted: the reader is checking a list of
 * stores, and a missing row looks like a store that was forgotten.
 */
const MovementGridPanel = ({ code, rows, stores, weekEndings }: Props) => {
  const grid = useMemo(
    () => movementGrid(rows, code, stores, weekEndings),
    [rows, code, stores, weekEndings],
  );
  const fmt = (n: number) => fmtMovement(n, grid.weighed);
  const unit = grid.weighed ? "lbs" : "units";
  const peak = Math.max(0, ...grid.rows.flatMap((r) => r.cells.map((v) => v ?? 0)));

  /** The cell is only a frame; the tile inside it carries the colour, so a
   *  2px gutter keeps neighbouring tiles apart, as in Sales Comp's grid. */
  const tileCell = "p-0.5 min-w-[64px]";
  const tile = "flex items-center justify-center h-8 rounded tabular-nums whitespace-nowrap";

  return (
    // No heading above the grid: the left list already highlights the item with
    // its code and total, and the bottom row repeats the total. The one thing a
    // heading said that nothing else did is the unit, so the bottom row says it.
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/*
        Scrolls both ways. Thirteen weeks of a long store name is wider than
        the panel, and the cells never wrap or squeeze, so the weeks scroll
        sideways while the Store column stays pinned on the left and the Total
        column on the right: the reader never loses which store a row is.

        `border-separate` rather than `border-collapse`, with the rules drawn
        on the cells: in collapse mode a sticky cell's border stays behind and
        scrolls away with the column it used to touch. Pinned cells carry
        their own background so the weeks pass under them, not through them.
      */}
      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
        <table className="min-w-full text-[13.5px] text-content border-separate border-spacing-0">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-10 bg-bkg px-4 py-2 text-left text-[12px] font-bold uppercase tracking-wide whitespace-nowrap border-b-2 border-r border-gray-200">
                Store
              </th>
              {weekEndings.map((w) => (
                <th
                  key={w}
                  className="bg-bkg px-2 py-2 text-center text-[12px] font-bold whitespace-nowrap border-b-2 border-gray-200"
                  title={`Week ending ${w}`}
                >
                  {shortDate(w)}
                </th>
              ))}
              <th className="sticky right-0 z-10 bg-bkg px-4 py-2 text-right text-[12px] font-bold uppercase tracking-wide whitespace-nowrap border-b-2 border-l border-gray-200">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map(({ store, cells, total }) => {
              const idle = cells.every((v) => v === null || v === 0);
              return (
                <tr key={store.storeid} className={`group ${idle ? "text-content/95" : ""}`}>
                  <td
                    className={`sticky left-0 z-[1] bg-custom-white group-hover:bg-row_selected px-4 py-1.5 whitespace-nowrap border-b border-r border-gray-100 ${idle ? "" : "font-semibold"}`}
                  >
                    {store.store_name || `Store ${store.store_number}`}
                  </td>
                  {cells.map((v, i) => {
                    if (v === null || v === 0) {
                      return (
                        <td key={weekEndings[i]} className={`${tileCell} group-hover:bg-row_selected border-b border-gray-100`}>
                          <div className={`${tile} text-content/95`}>–</div>
                        </td>
                      );
                    }
                    // A net return week (refunds beat sales) is real but has no
                    // place on a scale of how much moved, so it stays unshaded.
                    const heat = heatStyle(Math.max(v, 0), peak);
                    return (
                      <td key={weekEndings[i]} className={`${tileCell} group-hover:bg-row_selected border-b border-gray-100`}>
                        <div
                          className={`${tile} font-semibold`}
                          style={v > 0 ? { background: heat.bg, color: heat.color } : undefined}
                        >
                          {fmt(v)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-[1] bg-bkg px-4 py-1.5 text-right tabular-nums whitespace-nowrap font-bold border-b border-l border-gray-200">
                    {idle ? <span className="font-normal">0</span> : fmt(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* The header's own colours, so the totals read as the grid's frame
              rather than as a separate bar laid over it. */}
          <tfoot className="sticky bottom-0 z-20">
            <tr className="font-bold">
              <td className="sticky left-0 z-10 bg-bkg px-4 py-2 whitespace-nowrap border-t-2 border-r border-gray-200">
                Total movement <span className="font-semibold">({unit})</span>
              </td>
              {grid.weekTotals.map((v, i) => (
                <td
                  key={weekEndings[i]}
                  className="bg-bkg px-2 py-2 text-center tabular-nums whitespace-nowrap border-t-2 border-gray-200"
                >
                  {fmt(v)}
                </td>
              ))}
              <td className="sticky right-0 z-10 bg-bkg px-4 py-2 text-right tabular-nums whitespace-nowrap border-t-2 border-l border-gray-200">
                {fmt(grid.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MovementGridPanel;
