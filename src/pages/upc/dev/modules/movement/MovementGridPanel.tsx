import { useMemo } from "react";
import type { MovementRow } from "../../../../../features/dev/devUpcDevSlice";
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
 * A store that sold none of it in a week shows a dash rather than 0, and keeps
 * its row when it sold none at all: the reader is checking a list of stores,
 * and a missing row looks like a store that was forgotten.
 */
const MovementGridPanel = ({ code, description, rows, stores, weekEndings }: Props) => {
  const grid = useMemo(
    () => movementGrid(rows, code, stores, weekEndings),
    [rows, code, stores, weekEndings],
  );
  const fmt = (n: number) => fmtMovement(n, grid.weighed);
  const cell = "px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap";

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-baseline justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-content truncate">
            {description || code}
          </div>
          <div className="text-[11px] text-content/85">
            {code} · {grid.weighed ? "Pounds" : "Units"} per store, per week ending
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">Total</div>
          <div className="text-[13px] font-bold tabular-nums text-content">
            {fmt(grid.total)} {grid.weighed ? "lbs" : "units"}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
        <table className="min-w-full text-[12px] text-content border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="border-b border-gray-100">
              <th className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">Store</th>
              {weekEndings.map((w) => (
                <th key={w} className={`${cell} font-semibold`} title={`Week ending ${w}`}>
                  {shortDate(w)}
                </th>
              ))}
              <th className={`${cell} font-bold`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map(({ store, cells, total }) => (
              <tr key={store.storeid} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-2.5 py-1.5 whitespace-nowrap">
                  <span className="font-semibold">{store.store_number}</span>
                  {store.store_name && (
                    <span className="ml-1.5 text-content/85">{store.store_name}</span>
                  )}
                </td>
                {cells.map((v, i) => (
                  <td key={weekEndings[i]} className={cell}>
                    {v === null ? <span className="text-content/85">–</span> : fmt(v)}
                  </td>
                ))}
                <td className={`${cell} font-semibold`}>{fmt(total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-gray-50">
            <tr className="border-t border-gray-100 font-bold">
              <td className="px-2.5 py-1.5 whitespace-nowrap">All stores</td>
              {grid.weekTotals.map((v, i) => (
                <td key={weekEndings[i]} className={cell}>
                  {fmt(v)}
                </td>
              ))}
              <td className={cell}>{fmt(grid.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MovementGridPanel;
