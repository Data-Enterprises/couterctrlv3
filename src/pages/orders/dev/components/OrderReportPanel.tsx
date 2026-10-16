import { useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import SortHeader from "../../../../components-dev/SortHeader";
import { formatCurrency2 } from "../../../../utils";
import type { AllOrder } from "../../../../interfaces";
import type { GridSort, SortKey } from "../ordersRows";

interface Props {
  /** Already filtered, searched and sorted by the page. */
  rows: AllOrder[];
  sort: GridSort;
  onSort: (col: SortKey) => void;
  loading: boolean;
  onExport: () => void;
}

/**
 * Every line the configuration lets through, as one grid.
 *
 * It used to be a split pane: a list of orders down the left, and the lines of
 * whichever one you clicked on the right. That list is gone, because the left
 * panel now does the narrowing and a second list of orders inside the report
 * was asking the same question twice.
 *
 * The consequence is that a row no longer belongs to an order you already
 * picked, so the grid leads with the order number and sorts on it by default
 * — without that a thousand lines from forty orders are in no order at all.
 *
 * The KPIs count what is on screen rather than what one order holds: no store
 * number and no order number, because the grid can be showing many of each.
 */
const OrderReportPanel = ({
  rows,
  sort,
  onSort,
  loading,
  onExport,
}: Props) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(500);


  const visible = rows;

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  // Clamped rather than reset in an effect: a narrower filter can leave the
  // current page past the end, and a render that shows nothing while an
  // effect catches up is a flash of "no rows" on a set that has plenty.
  const safePage = Math.min(page, pageCount - 1);
  const paged = useMemo(
    () => visible.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [visible, safePage, pageSize],
  );

  // A new result, a new sort or a new column filter is a different list, and
  // page 7 of the old one means nothing in it.
  useEffect(() => {
    setPage(0);
  }, [rows, pageSize]);

  /** The whole filtered set, not the page — a total of 100 rows is not a
   *  total of anything somebody asked for. */
  const totals = useMemo(() => {
    let eRet = 0;
    let cogs = 0;
    let weight = 0;
    const stores = new Set<string>();
    const orders = new Set<string>();
    for (const o of visible) {
      eRet += o.e_ret ?? 0;
      cogs += o.cogs ?? 0;
      weight += o.weight ?? 0;
      stores.add(o.storenumber);
      orders.add(`${o.storenumber}:${o.order_id}`);
    }
    return { eRet, cogs, weight, stores: stores.size, orders: orders.size };
  }, [visible]);


  /** Right-aligned and sortable, on the shared tri-state header. */
  const numHead = (key: SortKey, label: string, width: number) => (
    <th className="px-3 py-2" style={{ width }}>
      <SortHeader
        col={key}
        label={label}
        sort={sort}
        onSort={onSort}
        className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-content hover:text-brand_navy"
      />
    </th>
  );

  const plainHead = (label: string, width: number) => (
    <th
      className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap"
      style={{ width }}
    >
      {label}
    </th>
  );

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flex: 1, minWidth: 0 }}
    >
      <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0 flex items-center gap-3">
        <span className="text-custom-white font-medium text-[13px]">
          Order lines
        </span>
        <div className="flex-1" />
        {!loading && visible.length > 0 && (
          <button data-help="export"
            onClick={onExport}
            title="Export CSV"
            className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 relative">
          <LoadingIndicator message="Loading orders" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyPrompt
          title="Nothing matches"
          description="Widen the configuration on the left to bring lines back."
        />
      ) : (
        <>
          <div className="grid grid-cols-6 divide-x divide-brand_navy/15 border-b border-gray-100 bg-custom-white flex-shrink-0">
            <Kpi label="Lines" value={visible.length.toLocaleString()} />
            <Kpi label="Orders" value={totals.orders.toLocaleString()} />
            <Kpi label="Stores" value={totals.stores.toLocaleString()} />
            <Kpi label="Weight" value={totals.weight.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
            <Kpi label="Ext retail" value={formatCurrency2(totals.eRet)} />
            <Kpi label="Ext cost" value={formatCurrency2(totals.cogs)} />
          </div>

          <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
            <table data-help="lines" className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10 bg-custom-white">
                <tr className="border-b border-b-brand_navy/15">
                  {numHead("order", "Order #", 90)}
                  {numHead("seq", "Seq #", 70)}
                  <th
                    className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap"
                    style={{ width: 100 }}
                  >
                    UPC
                  </th>
                  <th
                    className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap"
                    style={{ width: 220 }}
                  >
                    Description
                  </th>
                  <th
                    className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap"
                    style={{ width: 130 }}
                  >
                    Sub dept
                  </th>
                  <th
                    className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap"
                    style={{ width: 70 }}
                  >
                    Store
                  </th>
                  {numHead("qty", "Qty", 60)}
                  {plainHead("Cost", 80)}
                  {plainHead("Ext cost", 90)}
                  {plainHead("Retail", 80)}
                  {numHead("ext_retail", "Ext retail", 95)}
                  {numHead("profit", "Profit", 90)}
                  {plainHead("Margin", 70)}
                  {plainHead("Weight", 70)}
                </tr>
              </thead>
              <tbody className="bg-custom-white">
                {paged.map((o) => (
                  <tr
                    key={`${o.storenumber}-${o.order_id}-${o.line_number}`}
                    className="border-b border-b-brand_navy/15 even:bg-row_stripe"
                  >
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-content">
                      {o.order_id}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {o.line_number}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-content whitespace-nowrap">
                      {o.product_code}
                    </td>
                    <td className="px-3 py-2 font-medium text-content max-w-0 truncate">
                      {o.description}
                    </td>
                    <td className="px-3 py-2 text-content whitespace-nowrap">
                      {o.sub_department_description}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-content whitespace-nowrap">
                      {o.storenumber}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {o.qty}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {o.casesize > 0 ? formatCurrency2(o.base_cost / o.casesize) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {formatCurrency2(o.cogs)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {formatCurrency2(o.active_retail_price)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-content">
                      {formatCurrency2(o.e_ret)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-content">
                      {formatCurrency2(o.e_ret - o.cogs)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {o.e_ret > 0
                        ? `${(((o.e_ret - o.cogs) / o.e_ret) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-content">
                      {o.weight ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-100 px-3 py-1.5 flex-shrink-0">
            <span className="text-[11px] text-content/85">
              {visible.length === 0
                ? "No rows"
                : `${(safePage * pageSize + 1).toLocaleString()}–${Math.min(
                    (safePage + 1) * pageSize,
                    visible.length,
                  ).toLocaleString()} of ${visible.length.toLocaleString()}`}
            </span>

            <label className="flex items-center gap-1.5 text-[11px] text-content/85">
              Rows
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-content/20 bg-custom-white px-1.5 py-0.5 text-[11px] text-content"
                style={{ outline: "none" }}
              >
                {[100, 250, 500, 1000].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <PagerButton
                label="First"
                disabled={safePage === 0}
                onClick={() => setPage(0)}
              />
              <PagerButton
                label="Prev"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              />
              <span className="px-1.5 text-[11px] font-medium text-content tabular-nums">
                {safePage + 1} / {pageCount}
              </span>
              <PagerButton
                label="Next"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
              />
              <PagerButton
                label="Last"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(pageCount - 1)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PagerButton = ({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="rounded border border-content/20 px-2 py-0.5 text-[11px] font-medium text-content/85 transition-colors hover:border-content/35 hover:text-content disabled:opacity-50"
  >
    {label}
  </button>
);

const Kpi = ({ label, value }: { label: string; value: string }) => (
  <div className="px-4 pt-2.5 pb-2 text-center min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[13px] font-bold text-content truncate">{value}</div>
  </div>
);

export default OrderReportPanel;
