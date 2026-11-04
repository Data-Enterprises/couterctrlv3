import RecapSortHead from "./RecapSortHead";
import RecapTextTip from "./RecapTextTip";
import { count, money, pounds } from "./recapFormat";
import { NO_VENDOR } from "./recapItems";
import type { ItemSort, ItemSortCol, RecapItemRow } from "./recapTypes";
import { useCursorTip } from "./useCursorTip";

/**
 * UPC, Description, Sub dept, Vendor, Units, [Weight], Net sales. Fixed
 * widths for the figures so each head sits over its own numbers, and the
 * description takes the rest; a narrow panel tightens them.
 */
const colsOf = (withPounds: boolean, narrow: boolean) =>
  narrow
    ? `100px minmax(0,1fr) 100px 100px 56px${withPounds ? " 68px" : ""} 86px`
    : `125px minmax(0,1fr) 125px 130px 62px${withPounds ? " 82px" : ""} 96px`;

const lb = (n: number) => (n > 0 ? `${pounds(n)} lb` : "—");

/**
 * The item view's list (board 18): sortable heads, one page of items,
 * striped, scrolling inside the card, and a totals row pinned under it for
 * everything the filters and search leave, not just the page.
 *
 * Vendor names the one that sold the most of the item; "+1" when another
 * sold it too, and hovering that lists them all. Weight only at a store that
 * sells by weight, a dash on an item sold by the each.
 */
const RecapItemsTable = ({
  rows,
  totals,
  sort,
  onSort,
  withPounds,
  narrow,
}: {
  rows: RecapItemRow[];
  totals: { items: number; units: number; pounds: number; net: number };
  sort: ItemSort;
  onSort: (col: ItemSortCol) => void;
  withPounds: boolean;
  narrow: boolean;
}) => {
  const cols = colsOf(withPounds, narrow);
  const { tip, track, clear } = useCursorTip<string>();
  const tipRow = tip ? rows.find((r) => r.code === tip.key) : undefined;
  const head = (col: ItemSortCol, label: string, right = false) => (
    <RecapSortHead col={col} sort={sort} onSort={onSort} right={right}>
      {label}
    </RecapSortHead>
  );

  return (
    <>
      <div
        className="flex-none grid items-end gap-3 px-[18px] py-1.5 bg-gray-50 border-b border-gray-100"
        style={{ gridTemplateColumns: cols }}
      >
        {head("code", "UPC")}
        {head("name", "Description")}
        {head("dept", "Sub dept")}
        {head("vendor", "Vendor")}
        {head("units", "Units", true)}
        {withPounds && head("pounds", "Weight", true)}
        {head("net", "Net sales", true)}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar" role="rowgroup">
        {rows.map((r) => {
          const lead = r.vendors[0];
          return (
            <div
              key={r.code}
              role="row"
              className="grid items-center gap-3 px-[18px] h-[34px] text-[13px] text-content border-b border-gray-100 even:bg-row_stripe"
              style={{ gridTemplateColumns: cols }}
            >
              <span className="truncate tabular-nums">{r.code}</span>
              <span className="truncate">{r.name}</span>
              <span className="truncate">{r.subDeptName}</span>
              <span className="min-w-0 flex items-baseline gap-1">
                <span className="truncate">{!lead || lead === NO_VENDOR ? "—" : lead}</span>
                {r.vendors.length > 1 && (
                  <span
                    onMouseMove={track(r.code)}
                    onMouseLeave={clear}
                    className="flex-none font-semibold cursor-default"
                  >
                    +{r.vendors.length - 1}
                  </span>
                )}
              </span>
              <span className="text-right tabular-nums">{count(r.units)}</span>
              {withPounds && <span className="text-right tabular-nums">{lb(r.pounds)}</span>}
              <span className="text-right font-semibold tabular-nums">{money(r.net)}</span>
            </div>
          );
        })}
      </div>

      <div
        className="flex-none grid items-center gap-3 px-[18px] h-9 text-[13px] font-bold text-content bg-gray-50 border-t border-content"
        style={{ gridTemplateColumns: cols }}
      >
        <span>Total</span>
        <span className="tabular-nums">
          {count(totals.items)} {totals.items === 1 ? "item" : "items"}
        </span>
        <span />
        <span />
        <span className="text-right tabular-nums">{count(totals.units)}</span>
        {withPounds && <span className="text-right tabular-nums">{lb(totals.pounds)}</span>}
        <span className="text-right tabular-nums">{money(totals.net)}</span>
      </div>

      {tip && tipRow && <RecapTextTip lines={tipRow.vendors} x={tip.x} y={tip.y} />}
    </>
  );
};

export default RecapItemsTable;
