import { useMemo, useState } from "react";
import { useSuggestedCtx } from "./hooks";
import {
  setSheetKey,
  setTopDescFilter,
  setTopDeptFilter,
} from "../../../features/dev/devSuggestedSlice";
import { deptLabel, fmtLb, fmtLbOrDash } from ".";
import ColFilter from "../../../components-dev/filters/ColFilter";
import { colInputStyle } from "../../../components-dev/filters/colFilterStyles";
import SortHeader from "../../../components-dev/SortHeader";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import UpcContextMenu from "../../../components-dev/UpcContextMenu";
import type { SuggestedItem } from "../../../interfaces";

/**
 * The store's heaviest lines, before a department is picked.
 *
 * ONE store — whichever is open on the left. Item rows are single-store by
 * design: the endpoint refuses item grain for a group, so a cross-store item
 * list is not a thing one call can return.
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

const TH =
  "px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85";
const SORT_TH =
  "w-full justify-end text-[10px] font-semibold uppercase tracking-wide text-content/85 hover:text-content";

type SortCol = "daily" | "order";

const TopToOrder = () => {
  const ctx = useSuggestedCtx();
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();
  const [draftDesc, setDraftDesc] = useState("");
  const [draftDept, setDraftDept] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const desc = ctx.topDescFilter.trim().toLowerCase();
    const dept = ctx.topDeptFilter.trim().toLowerCase();
    return ctx.items.filter((i) => {
      if (desc && !(i.product_description ?? "").toLowerCase().includes(desc))
        return false;
      if (
        dept &&
        !deptLabel(i.sub_department_description).toLowerCase().includes(dept)
      )
        return false;
      return true;
    });
  }, [ctx.items, ctx.topDescFilter, ctx.topDeptFilter]);

  /**
   * Cut to the top N AFTER filtering, so narrowing to one department gives that
   * department's heaviest lines rather than whichever of the store's top 25
   * happened to survive.
   *
   * The unsorted order is the endpoint's own — it ranks on the same
   * `suggested_weight` expression the rollup sums, so a local default sort
   * could only ever disagree with the tree. Sorting is a lens over that.
   */
  const rows = applySort<SuggestedItem>(filtered.slice(0, TOP_N), (r, col) =>
    col === "daily" ? (r.avg_daily_weight ?? null) : (r.suggested_weight ?? null),
  );

  const storeTotal = useMemo(
    () => ctx.items.reduce((s, i) => s + (i.suggested_weight ?? 0), 0),
    [ctx.items],
  );
  const shown = rows.reduce((s, i) => s + (i.suggested_weight ?? 0), 0);
  const sharePct = storeTotal > 0 ? (shown / storeTotal) * 100 : 0;
  const isFiltered = !!(ctx.topDescFilter || ctx.topDeptFilter);

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
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-content/85">
            Top to order · every department at this store
          </span>
          <span className="text-[13px] text-content/85 tabular-nums flex-shrink-0">
            these {rows.length} are{" "}
            <span className="font-semibold text-content">
              {sharePct.toFixed(0)}%
            </span>{" "}
            of {fmtLb(storeTotal)} lb
          </span>
        </div>
        <p className="text-[13px] text-content/85 mt-1 leading-snug">
          The heaviest lines in this store for this window. Open a department on
          the left for its full sheet, or click a row to jump to it.
        </p>
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/85">
            No results match filters
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="sticky top-0 bg-gray-100 border-b border-gray-100 z-10">
                <th className={`${TH} text-left`} style={{ overflow: "visible" }}>
                  <ColFilter
                    label="Item"
                    active={!!ctx.topDescFilter}
                    onApply={() => ctx.dispatch(setTopDescFilter(draftDesc))}
                    onClear={() => {
                      ctx.dispatch(setTopDescFilter(""));
                      setDraftDesc("");
                    }}
                  >
                    <input
                      autoFocus
                      style={colInputStyle}
                      placeholder="Search description…"
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value)}
                    />
                  </ColFilter>
                </th>
                <th className={`${TH} text-left`} style={{ overflow: "visible" }}>
                  <ColFilter
                    label="Department"
                    active={!!ctx.topDeptFilter}
                    onApply={() => ctx.dispatch(setTopDeptFilter(draftDept))}
                    onClear={() => {
                      ctx.dispatch(setTopDeptFilter(""));
                      setDraftDept("");
                    }}
                  >
                    <input
                      autoFocus
                      style={colInputStyle}
                      placeholder="Search department…"
                      value={draftDept}
                      onChange={(e) => setDraftDept(e.target.value)}
                    />
                  </ColFilter>
                </th>
                <th className={`${TH} text-right whitespace-nowrap`}>
                  <SortHeader
                    col="daily"
                    label="Avg lb/day"
                    sort={sort}
                    onSort={handleSort}
                    className={SORT_TH}
                  />
                </th>
                <th className={`${TH} text-right whitespace-nowrap`}>
                  <SortHeader
                    col="order"
                    label="Order lb"
                    sort={sort}
                    onSort={handleSort}
                    className={SORT_TH}
                  />
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
                  className="border-b border-[#1e2a4a]/15 even:bg-row_stripe hover:bg-gray-50 transition-colors cursor-pointer"
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
            <tfoot>
              <tr className="sticky bottom-0 bg-gray-50 border-t-2 border-content/70 font-bold text-[14px]">
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right text-content/85">
                  {isFiltered ? `${rows.length} shown` : `Top ${rows.length}`}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content/85">
                  {fmtLb(rows.reduce((s, r) => s + (r.avg_daily_weight ?? 0), 0))}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content/85">
                  {fmtLb(shown)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
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
