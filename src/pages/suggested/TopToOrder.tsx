import { useMemo, useState } from "react";
import { useSuggestedCtx } from "./hooks";
import { setSheetKey } from "../../features/suggestedSlice";
import { deptLabel, fmtLb, fmtLbOrDash } from ".";
import UpcContextMenu from "../../components/UpcContextMenu";

/**
 * The store's heaviest lines, before a department is picked.
 *
 * This slot used to say "Select a department" and do nothing, which asks the
 * buyer to guess where the weight is. It is not a guess anyone should have to
 * make: at store 111 the single biggest line is bananas, in Wic Produce, so a
 * buyer who opens Meat by # first because it is the heaviest DEPARTMENT walks
 * straight past the heaviest ITEM.
 *
 * Costs no call of its own. The store's rows are already loaded — the endpoint
 * only ever answered at store grain — and it returns them
 * `order by suggested_weight desc`, so this is the response as it arrived.
 *
 * Clicking a row jumps to that item's department, which is the reason the
 * Department column is a column rather than a caption.
 */
const TOP_N = 25;

const TopToOrder = () => {
  const ctx = useSuggestedCtx();
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);

  // Trust the endpoint's ordering rather than re-sorting: it ranks on the same
  // `suggested_weight` expression the rollup sums, so a local sort could only
  // ever disagree with the tree.
  const rows = useMemo(() => ctx.items.slice(0, TOP_N), [ctx.items]);

  const storeTotal = useMemo(
    () => ctx.items.reduce((s, i) => s + (i.suggested_weight ?? 0), 0),
    [ctx.items],
  );
  const shown = rows.reduce((s, i) => s + (i.suggested_weight ?? 0), 0);
  const sharePct = storeTotal > 0 ? (shown / storeTotal) * 100 : 0;

  if (ctx.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <p className="text-[13px] font-medium text-content">
          No scale items in this store
        </p>
        <p className="text-[11px] text-content/85">
          Nothing here sells by the pound in the lookback window
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
            Top to order · every department
          </span>
          <span className="text-[10px] text-content/85 tabular-nums">
            these {rows.length} are{" "}
            <span className="font-semibold text-content">
              {sharePct.toFixed(0)}%
            </span>{" "}
            of {fmtLb(storeTotal)} lb
          </span>
        </div>
        <p className="text-[10.5px] text-content/85 mt-1 leading-snug">
          The heaviest lines in the store for this window. Open a department on
          the left for its full sheet, or click a row to jump to it.
        </p>
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="sticky top-0 bg-gray-100 border-b border-gray-100 z-10">
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 text-left">
                Item
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 text-left">
                Department
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 text-right whitespace-nowrap">
                Avg lb/day
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 text-right whitespace-nowrap">
                Order lb
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.sub_department ?? "none"}-${r.product_code}`}
                onClick={() =>
                  ctx.dispatch(
                    setSheetKey({
                      storeid: r.storeid ?? ctx.activeStoreId!,
                      storeLabel: ctx.activeStoreLabel,
                      sub_department: r.sub_department,
                      sub_department_description: r.sub_department_description,
                    }),
                  )
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCtxMenu({
                    x: e.clientX,
                    y: e.clientY,
                    upc: String(r.product_code),
                  });
                }}
                className="border-b border-[#1e2a4a]/15 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-3 py-2 text-content font-medium">
                  {r.product_description ?? String(r.product_code)}
                </td>
                <td
                  className={`px-3 py-2 ${
                    r.sub_department === null
                      ? "text-severity_watch_text font-medium"
                      : "text-content/85"
                  }`}
                >
                  {deptLabel(r.sub_department_description)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content">
                  {fmtLb(r.avg_daily_weight)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content font-semibold">
                  {fmtLbOrDash(r.suggested_weight)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={rows.map((r) => String(r.product_code))}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
};

export default TopToOrder;
