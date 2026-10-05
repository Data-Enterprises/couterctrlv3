import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import ColFilter from "../../../../components-dev/filters/ColFilter";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import { formatCurrency2 } from "../../../../utils";
import type { AllOrder } from "../../../../interfaces";

interface Props {
  /** Whatever survived the configuration panel. */
  lines: AllOrder[];
  loading: boolean;
  onExport: () => void;
}

type SortKey = "order" | "seq" | "qty" | "ext_retail" | "profit";

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
const OrderReportPanel = ({ lines, loading, onExport }: Props) => {
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [sort, setSort] = useState<SortKey>("order");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const visible = useMemo(() => {
    const matched = lines.filter((o) => {
      if (
        appliedUpc &&
        !String(o.product_code).toLowerCase().includes(appliedUpc.toLowerCase())
      )
        return false;
      if (
        appliedDesc &&
        !o.description.toLowerCase().includes(appliedDesc.toLowerCase())
      )
        return false;
      return true;
    });

    const by = (o: AllOrder) => {
      switch (sort) {
        case "seq":
          return o.line_number;
        case "qty":
          return o.qty;
        case "ext_retail":
          return o.e_ret ?? 0;
        case "profit":
          return (o.e_ret ?? 0) - (o.cogs ?? 0);
        default:
          return o.order_id;
      }
    };

    return [...matched].sort((a, b) => {
      const d = by(a) - by(b);
      // Inside one order the line number is the only order that means
      // anything, so it is always the tiebreak.
      const tie = d !== 0 ? d : a.order_id - b.order_id || a.line_number - b.line_number;
      return dir === "asc" ? tie : -tie;
    });
  }, [lines, appliedUpc, appliedDesc, sort, dir]);

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

  const onSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("asc");
    }
  };

  const arrow = (key: SortKey) =>
    sort === key ? (dir === "asc" ? " ↑" : " ↓") : "";

  const numHead = (key: SortKey, label: string, width: number) => (
    <th
      className="text-right px-3 py-2 whitespace-nowrap"
      style={{ width }}
    >
      <button
        onClick={() => onSort(key)}
        className="w-full text-right text-[9px] font-semibold uppercase tracking-wide text-content hover:text-brand_navy transition-colors"
      >
        {label}
        {arrow(key)}
      </button>
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
          <button
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
      ) : lines.length === 0 ? (
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
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10 bg-custom-white">
                <tr className="border-b border-b-brand_navy/15">
                  {numHead("order", "Order #", 90)}
                  {numHead("seq", "Seq #", 70)}
                  <th className="text-left px-3 py-2" style={{ width: 100 }}>
                    <ColFilter
                      label="UPC"
                      active={!!appliedUpc}
                      onApply={() => setAppliedUpc(draftUpc)}
                      onClear={() => {
                        setAppliedUpc("");
                        setDraftUpc("");
                      }}
                    >
                      <input
                        autoFocus
                        style={colInputStyle}
                        placeholder="Search UPC…"
                        value={draftUpc}
                        onChange={(e) => setDraftUpc(e.target.value)}
                      />
                    </ColFilter>
                  </th>
                  <th className="text-left px-3 py-2" style={{ width: 220 }}>
                    <ColFilter
                      label="Description"
                      active={!!appliedDesc}
                      onApply={() => setAppliedDesc(draftDesc)}
                      onClear={() => {
                        setAppliedDesc("");
                        setDraftDesc("");
                      }}
                    >
                      <input
                        autoFocus
                        style={colInputStyle}
                        placeholder="Search…"
                        value={draftDesc}
                        onChange={(e) => setDraftDesc(e.target.value)}
                      />
                    </ColFilter>
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
                {visible.map((o) => (
                  <tr
                    key={`${o.storenumber}-${o.order_id}-${o.line_number}`}
                    className="border-b border-b-brand_navy/15 even:bg-row_stripe hover:bg-gray-50 transition-colors"
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
        </>
      )}
    </div>
  );
};

const Kpi = ({ label, value }: { label: string; value: string }) => (
  <div className="px-4 pt-2.5 pb-2 text-center min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[13px] font-bold text-content truncate">{value}</div>
  </div>
);

export default OrderReportPanel;
