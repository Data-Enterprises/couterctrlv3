import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setTopItems,
  setTopItemsLoading,
} from "../../../../features/dev/devSalesLedgerSlice";
import {
  getItemDetail,
  getTopItems,
  TOP_ITEMS_FETCH,
  TOP_ITEMS_SHOWN,
  type ItemDetailResponse,
  type TopItemRow,
  type TopItemsResponse,
} from "../../../../api/topItems";
import {
  avgPrice,
  grossProfit,
  pointsFor,
  promoShare,
  rankBySales,
  topItemInsight,
  type ItemTone,
} from "../shared/topItems";
import type { JsonError } from "../../../../interfaces";
import { formatCurrency2 } from "../../../../utils";

/**
 * The store's biggest sellers, and one of them drilled into.
 *
 * Built on the Sub Dept Margins item view rather than inventing a shape: a
 * ranked list on the left, and on the right a CTA sentence over a lead card
 * for the ranking metric with its supporting metrics beside it. Three things
 * that view has no data for sit under it — how the item rang, what it costs
 * to buy, and the invoices behind that.
 *
 * **Ranked by sales, not units.** `sales/topitems` orders by `qty DESC`, so
 * the two hundred it returns are the two hundred biggest MOVERS — a $16 item
 * selling five is nowhere in that list and belongs near the top of this one.
 * No re-sort can recover a row that never came back, so the fetch asks for the
 * endpoint's ceiling and the top two hundred by sales are taken out of it. An
 * item outside the top five hundred by units but inside the top two hundred by
 * sales is still missed; that takes a very expensive single sale to arrange,
 * and the real fix is `ORDER BY total_sales` on the endpoint.
 */

const TONE: Record<ItemTone, { bg: string; text: string; dot: string }> = {
  critical: {
    bg: "bg-severity_critical_bg",
    text: "text-severity_critical_text",
    dot: "bg-severity_critical_text",
  },
  watch: {
    bg: "bg-severity_watch_bg",
    text: "text-severity_watch_text",
    dot: "bg-severity_watch_text",
  },
  healthy: {
    bg: "bg-severity_healthy_bg",
    text: "text-severity_healthy_text",
    dot: "bg-severity_healthy_text",
  },
  unknown: { bg: "bg-bkg", text: "text-content", dot: "bg-gray-400" },
};

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : formatCurrency2(n);

const pctText = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const dayText = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}/${y.slice(2)}`;
};

const PopupTopItems = ({
  storeId,
  storeName,
  start,
  end,
}: {
  storeId: number;
  storeName: string;
  /** yyyy-mm-dd, the week the popup is showing. */
  start: string;
  end: string;
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((state) => state.app);
  const { topItems, topItemPoints, topItemsKey, topItemsLoading } =
    useAppSelector((state) => state.dev.salesLedger);

  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<ItemDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const key = `${storeId}__${start}__${end}`;
  const haveRows = topItemsKey === key;

  /** One fetch per store and week. Switching to Hourly and back reuses it —
   *  the key is what decides, not whether this component has mounted. */
  useEffect(() => {
    if (haveRows || topItemsLoading) return;
    let live = true;
    dispatch(setTopItemsLoading(true));
    getTopItems(url, token, storeId, start, end, TOP_ITEMS_FETCH)
      .then((resp) => {
        if (!live) return;
        const j: TopItemsResponse = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Could not read this store's top items");
          return;
        }
        dispatch(
          setTopItems({
            rows: j.items ?? [],
            points: j.price_points ?? [],
            key,
          }),
        );
      })
      .catch((err: JsonError) => live && toast.error(err.message))
      .finally(() => live && dispatch(setTopItemsLoading(false)));
    return () => {
      live = false;
    };
  }, [key, haveRows]);

  // A code from the last store is not a code in this one.
  useEffect(() => {
    setSelectedCode(null);
    setDetail(null);
  }, [key]);

  /** The drill-down, fetched when a row is opened. Its own loading flag: the
   *  list stays usable while it lands. */
  useEffect(() => {
    if (!selectedCode) {
      setDetail(null);
      return;
    }
    let live = true;
    setDetailLoading(true);
    setDetail(null);
    getItemDetail(url, token, storeId, selectedCode, start, end)
      .then((resp) => {
        if (!live) return;
        const j: ItemDetailResponse = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Could not read that item");
          return;
        }
        setDetail(j);
      })
      .catch((err: JsonError) => live && toast.error(err.message))
      .finally(() => live && setDetailLoading(false));
    return () => {
      live = false;
    };
  }, [selectedCode, key]);

  const ranked = useMemo(
    () => (haveRows ? rankBySales(topItems, TOP_ITEMS_SHOWN) : []),
    [topItems, haveRows],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (r) =>
        r.product_description.toLowerCase().includes(q) ||
        r.product_code.includes(q),
    );
  }, [ranked, search]);

  const selected: TopItemRow | null =
    ranked.find((r) => r.product_code === selectedCode) ?? null;

  const points = useMemo(
    () => (selected ? pointsFor(topItemPoints, selected.product_code) : []),
    [selected, topItemPoints],
  );

  const insight = selected ? topItemInsight(selected, points) : null;

  if (topItemsLoading && !haveRows) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        Reading this store&rsquo;s top items&hellip;
      </div>
    );
  }

  if (haveRows && ranked.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No items sold in this store that week
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* The ranked list */}
      <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-gray-100">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 border-b border-gray-100 flex-shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item or UPC…"
            aria-label="Search items"
            className="flex-1 min-w-0 text-[11.5px] px-2 py-1 rounded-md border border-gray-200 bg-custom-white text-content"
          />
          <span className="text-[10px] font-semibold text-content/85 whitespace-nowrap">
            Top {Math.min(ranked.length, TOP_ITEMS_SHOWN)} by sales
          </span>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
          <span className="w-2.5 flex-shrink-0" />
          <span className="flex-1 min-w-0 text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
            Item
          </span>
          <span className="w-[72px] text-right text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
            Sales
          </span>
          <span className="w-[56px] text-right text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
            Margin
          </span>
        </div>

        <div className="overflow-y-auto thin-scrollbar flex-1">
          {shown.map((r) => {
            const tone = topItemInsight(
              r,
              pointsFor(topItemPoints, r.product_code),
            ).tone;
            const isSel = selectedCode === r.product_code;
            return (
              <button
                key={r.product_code}
                onClick={() =>
                  setSelectedCode(isSel ? null : r.product_code)
                }
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
                  isSel
                    ? "bg-row_selected border-row_selected_border"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TONE[tone].dot}`}
                />
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-[12px] font-medium text-content truncate"
                    title={r.product_description}
                  >
                    {r.product_description}
                  </span>
                  <span className="block text-[10.5px] text-content/85 tabular-nums">
                    {r.product_code} · {r.qty.toLocaleString()} units
                  </span>
                </span>
                <span className="w-[72px] text-right text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
                  {money(r.total_sales)}
                </span>
                <span className="w-[56px] text-right text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
                  {pctText(r.margin)}
                </span>
              </button>
            );
          })}
          {shown.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              Nothing matches that search
            </div>
          )}
        </div>
      </div>

      {/* The selected item */}
      <div className="flex-1 min-w-0 flex flex-col">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-[12px] text-content px-8 text-center">
            Pick an item to see how it rang and what it costs you.
          </div>
        ) : (
          <>
            {insight && (
              <div
                className={`flex-shrink-0 px-4 py-2.5 border-b border-gray-100 ${TONE[insight.tone].bg}`}
              >
                <div
                  className={`flex items-baseline justify-between gap-3 ${TONE[insight.tone].text}`}
                >
                  <span className="text-[12px] font-semibold truncate">
                    {selected.product_description}
                    <span className="font-normal tabular-nums opacity-90 ml-1.5">
                      {selected.product_code}
                    </span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide flex-shrink-0">
                    {insight.label}
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed mt-1 ${TONE[insight.tone].text}`}
                >
                  {insight.detail}
                </p>
              </div>
            )}

            <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100">
              <div className="grid grid-cols-[40%_1fr] gap-2">
                {/* Lead card: the metric the list ranks on, with units beside
                    it — the second figure everybody reads next. */}
                <div className="rounded-md border border-brand_navy/15 shadow-sm bg-gray-50 p-2.5 text-center flex flex-col justify-center">
                  <div className="text-[11px] font-semibold text-content">
                    Sales
                  </div>
                  <div className="text-[18px] font-semibold text-content leading-tight">
                    {money(selected.total_sales)}
                  </div>
                  <div className="text-[11.5px] font-semibold text-content/85 tabular-nums">
                    {selected.qty.toLocaleString()} units
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-gray-200">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-content">
                        Margin
                      </div>
                      <div className="text-[12px] font-semibold text-content">
                        {pctText(selected.margin)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-content">
                        Profit
                      </div>
                      <div className="text-[12px] font-semibold text-content">
                        {money(grossProfit(selected))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-brand_navy/15 shadow-sm bg-gray-50 px-2.5 py-1 flex flex-col justify-center">
                  {[
                    {
                      label: "Avg price",
                      value: money(avgPrice(selected)),
                    },
                    {
                      label: "Unit cost",
                      value: money(
                        selected.qty > 0
                          ? selected.ext_cost / selected.qty
                          : null,
                      ),
                    },
                    {
                      label: "Off regular",
                      value: `${Math.round(promoShare(selected) * 100)}%`,
                    },
                    {
                      label: "Cost coverage",
                      value:
                        selected.cost_coverage === null
                          ? "—"
                          : `${Math.round(selected.cost_coverage)}%`,
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="grid grid-cols-[1fr_auto] gap-1.5 items-center py-1 border-t border-gray-200 first:border-t-0 text-[11.5px]"
                    >
                      <span className="font-semibold text-content truncate">
                        {m.label}
                      </span>
                      <span className="text-[12px] font-semibold text-content text-right tabular-nums">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {/* How it rang */}
              <div className="px-4 py-2.5 border-b border-brand_navy/15">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11.5px] font-medium uppercase tracking-wide text-content">
                    How it rang
                  </span>
                  <span className="text-[11px] text-content/85">
                    {points.length} price
                    {points.length === 1 ? "" : "s"}
                  </span>
                </div>
                {points.length === 0 ? (
                  <p className="text-[11px] text-content/85">
                    No price came back for this item.
                  </p>
                ) : (
                  points.map((p) => (
                    <div
                      key={p.price}
                      className="grid grid-cols-[1fr_64px_80px] gap-2 items-center py-1 border-b border-brand_navy/15 last:border-b-0 text-[11.5px] text-content"
                    >
                      <span className="text-[13px] font-semibold tabular-nums">
                        {money(p.price)}
                      </span>
                      <span className="text-right font-semibold tabular-nums">
                        {p.units.toLocaleString()}
                      </span>
                      <span className="text-right tabular-nums">
                        {money(p.netSales)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* What it costs */}
              <div className="px-4 py-2.5 border-b border-brand_navy/15">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11.5px] font-medium uppercase tracking-wide text-content">
                    What it costs you
                  </span>
                  {detail?.cost_summary && (
                    <span className="text-[11px] text-content/85">
                      {detail.cost_summary.purchases} purchase
                      {detail.cost_summary.purchases === 1 ? "" : "s"} ·{" "}
                      {detail.cost_summary.days} days
                    </span>
                  )}
                </div>

                {detailLoading && (
                  <p className="text-[11px] text-content/85">
                    Reading what you have paid&hellip;
                  </p>
                )}

                {!detailLoading && !detail?.cost_summary && (
                  <p className="text-[11px] text-content/85 leading-snug">
                    Nothing bought in the last 120 days, so there is no cost
                    history to compare against.
                  </p>
                )}

                {detail?.cost_summary && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-bkg px-2.5 py-2">
                      <div className="text-[11px] font-semibold uppercase text-content/85">
                        Paying now
                      </div>
                      <div className="text-[15px] font-semibold text-content tabular-nums">
                        {money(detail.cost_summary.paying_now)}
                      </div>
                    </div>
                    <div className="rounded-md bg-severity_healthy_bg px-2.5 py-2">
                      <div className="text-[11px] font-semibold uppercase text-severity_healthy_text">
                        Best seen
                      </div>
                      <div className="text-[15px] font-semibold text-severity_healthy_text tabular-nums">
                        {money(detail.cost_summary.best_seen)}
                      </div>
                    </div>
                    <div className="rounded-md bg-severity_watch_bg px-2.5 py-2">
                      <div className="text-[11px] font-semibold uppercase text-severity_watch_text">
                        Waiting worth
                      </div>
                      <div className="text-[15px] font-semibold text-severity_watch_text tabular-nums">
                        {money(detail.cost_summary.gap)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* The invoices */}
              {detail && detail.cost_history.length > 0 && (
                <div className="px-4 py-2.5">
                  <div className="text-[11.5px] font-medium uppercase tracking-wide text-content mb-1.5">
                    What you have paid
                  </div>
                  <div className="grid grid-cols-[86px_1fr_68px_68px] gap-2 pb-1 border-b border-brand_navy/15 text-[11px] font-semibold uppercase tracking-wide text-content/85">
                    <span>Invoice</span>
                    <span>Vendor</span>
                    <span className="text-right">List</span>
                    <span className="text-right">Paid</span>
                  </div>
                  {[...detail.cost_history]
                    .reverse()
                    .map((h) => (
                      <div
                        key={h.invoice_date}
                        className="grid grid-cols-[86px_1fr_68px_68px] gap-2 items-center py-1 border-b border-brand_navy/15 text-[11.5px] text-content even:bg-row_stripe"
                      >
                        <span className="tabular-nums">
                          {dayText(h.invoice_date)}
                        </span>
                        <span className="truncate text-content/85">
                          {h.vendor_name ?? "—"}
                        </span>
                        <span className="text-right tabular-nums text-content/85">
                          {money(h.list_unit)}
                        </span>
                        {/* Green is the allowance. The endpoint returns it as
                            its own field, but it IS list minus paid, so a
                            third column would say the same thing twice. */}
                        <span
                          className={`text-right tabular-nums font-semibold ${
                            h.allowance > 0.0001
                              ? "text-severity_healthy_text"
                              : "text-content"
                          }`}
                          title={
                            h.allowance > 0.0001
                              ? `${money(h.allowance)} allowance`
                              : undefined
                          }
                        >
                          {money(h.paid_unit)}
                        </span>
                      </div>
                    ))}
                  <p className="text-[11px] text-content/85 mt-1.5 leading-snug">
                    Green is an allowance — paid under list. Cost reaches back
                    further than the sales week on purpose: a week cannot say
                    whether today&rsquo;s price is a good one.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <span className="sr-only">{storeName}</span>
    </div>
  );
};

export default PopupTopItems;
