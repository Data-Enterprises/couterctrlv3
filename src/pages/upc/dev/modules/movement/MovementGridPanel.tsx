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
  description: string;
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
const MovementGridPanel = ({ code, description, rows, stores, weekEndings }: Props) => {
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
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-content truncate">
            {description || code}
          </div>
          <div className="text-[12px] text-content/85">
            {code} · {grid.weighed ? "Pounds" : "Units"} per store, per week ending
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-content">
            Total movement
          </div>
          <div className="text-[17px] font-bold tabular-nums text-content">
            {fmt(grid.total)} <span className="text-[12px] font-semibold">{unit}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
        <table className="min-w-full text-[13.5px] text-content border-collapse">
          <thead className="sticky top-0 z-10 bg-bkg">
            <tr className="border-b-2 border-gray-200">
              <th className="px-4 py-2 text-left text-[12px] font-bold uppercase tracking-wide whitespace-nowrap">
                Store
              </th>
              {weekEndings.map((w) => (
                <th
                  key={w}
                  className="px-2 py-2 text-center text-[12px] font-bold whitespace-nowrap"
                  title={`Week ending ${w}`}
                >
                  {shortDate(w)}
                </th>
              ))}
              <th className="px-4 py-2 text-right text-[12px] font-bold uppercase tracking-wide whitespace-nowrap border-l border-gray-200">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map(({ store, cells, total }) => {
              const idle = cells.every((v) => v === null || v === 0);
              return (
                <tr
                  key={store.storeid}
                  className={`border-b border-gray-100 hover:bg-row_selected ${idle ? "text-content/85" : ""}`}
                >
                  <td className={`px-4 py-1.5 whitespace-nowrap ${idle ? "" : "font-semibold"}`}>
                    {store.store_name || `Store ${store.store_number}`}
                  </td>
                  {cells.map((v, i) => {
                    if (v === null || v === 0) {
                      return (
                        <td key={weekEndings[i]} className={tileCell}>
                          <div className={`${tile} text-content/85`}>–</div>
                        </td>
                      );
                    }
                    // A net return week (refunds beat sales) is real but has no
                    // place on a scale of how much moved, so it stays unshaded.
                    const heat = heatStyle(Math.max(v, 0), peak);
                    return (
                      <td key={weekEndings[i]} className={tileCell}>
                        <div
                          className={`${tile} font-semibold`}
                          style={v > 0 ? { background: heat.bg, color: heat.color } : undefined}
                        >
                          {fmt(v)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-1.5 text-right tabular-nums whitespace-nowrap font-bold border-l border-gray-200 bg-bkg">
                    {idle ? <span className="font-normal">0</span> : fmt(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* The header's own colours, so the totals read as the grid's frame
              rather than as a separate bar laid over it. */}
          <tfoot className="sticky bottom-0 bg-bkg">
            <tr className="border-t-2 border-gray-200 font-bold">
              <td className="px-4 py-2 whitespace-nowrap">Total movement</td>
              {grid.weekTotals.map((v, i) => (
                <td key={weekEndings[i]} className="px-2 py-2 text-center tabular-nums whitespace-nowrap">
                  {fmt(v)}
                </td>
              ))}
              <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap border-l border-gray-200">
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
