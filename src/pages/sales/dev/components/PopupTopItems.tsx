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
  compareWindows,
  count,
  deltaPct,
  deltaPoints,
  pointsFor,
  promoShare,
  rankBySales,
  topItemInsight,
  type ItemTone,
  type TopItemCompared,
} from "../shared/topItems";
import type { JsonError } from "../../../../interfaces";
import {
  CTA_SEVERITY_CLASSES,
  pillClass,
  severityDotClass,
  type Severity,
} from "../../../../utils/severity";
import { formatCurrency2 } from "../../../../utils";

/**
 * The store's biggest sellers, and one of them drilled into.
 *
 * Built on the Sub Dept Margins item view: a ranked list on the left, and on
 * the right a CTA sentence over a lead card for the ranking metric with its
 * supporting metrics beside it. Three things that view has no data for sit
 * under it — how the item rang, what it costs to buy, and the invoices.
 *
 * **Ranked by sales, not units.** `sales/topitems` orders by `qty DESC`, so
 * its two hundred are the two hundred biggest MOVERS — a $16 item selling
 * five is nowhere in that list and belongs near the top of this one. No
 * re-sort recovers a row that never came back, so the fetch asks for the
 * endpoint's ceiling and the top two hundred by sales come out of it.
 *
 * **Three windows, three calls.** The endpoint answers one week, and this
 * panel's whole language is vs LW / vs LY — every other tab on it compares.
 * So this asks for all three and joins them on product code. The alternative
 * was leaving those columns empty, which would make the tab read like a
 * different page.
 */

/**
 * The tab's tones, off the shared severity map.
 *
 * `unknown` is this tab's own and is not a severity: an item whose margin the
 * server withheld has not been graded badly, it has not been graded. It takes
 * a neutral grey rather than a colour that reads as a verdict.
 */
const ctaTone = (tone: ItemTone) =>
  tone === "unknown"
    ? { bg: "bg-bkg", text: "text-content" }
    : CTA_SEVERITY_CLASSES[tone as Severity];

const dotClass = (tone: ItemTone) =>
  tone === "unknown" ? "bg-gray-400" : severityDotClass[tone as Severity];

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : formatCurrency2(n);

const pctText = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n)}%`;

/** Margin moves in points, not percent: 22% to 11% is eleven points down, and
 *  "-50%" invites someone to read it as half the sales. */
const pointsText = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}`;

const dayText = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
};

const PopupTopItems = ({
  storeId,
  start,
  end,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
  threshold,
}: {
  storeId: number;
  /** yyyy-mm-dd. The week the popup is showing, and its two baselines. */
  start: string;
  end: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  /** The page's grading threshold, so these pills grade like every other. */
  threshold: number;
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
  const [baselines, setBaselines] = useState<{
    key: string;
    lw: TopItemRow[];
    ly: TopItemRow[];
  } | null>(null);

  const key = `${storeId}__${start}__${end}`;
  const haveRows = topItemsKey === key;
  const haveBase = baselines?.key === key;

  /**
   * All three windows at once.
   *
   * This week's rows and its price points go to the slice, so switching to
   * Hourly and back does not refetch. The baselines stay local: they are only
   * ever two columns on this tab.
   */
  useEffect(() => {
    if ((haveRows && haveBase) || topItemsLoading) return;
    let live = true;
    dispatch(setTopItemsLoading(true));
    Promise.all([
      getTopItems(url, token, storeId, start, end, TOP_ITEMS_FETCH),
      getTopItems(url, token, storeId, lwStart, lwEnd, TOP_ITEMS_FETCH),
      getTopItems(url, token, storeId, lyStart, lyEnd, TOP_ITEMS_FETCH),
    ])
      .then(([tyResp, lwResp, lyResp]) => {
        if (!live) return;
        const ty: TopItemsResponse = tyResp.data;
        if (ty.error !== 0) {
          toast.error(ty.msg || "Could not read this store's top items");
          return;
        }
        // A baseline that failed is not a baseline of zero: that would read as
        // "nothing sold last year" and grade every item as a triumph. Empty
        // means the columns show a dash, which is the truth.
        const lw: TopItemsResponse = lwResp.data;
        const ly: TopItemsResponse = lyResp.data;
        if (lw.error !== 0 || ly.error !== 0) {
          toast.warn(
            "Last week or last year did not load — those columns are blank",
          );
        }
        dispatch(
          setTopItems({
            rows: ty.items ?? [],
            points: ty.price_points ?? [],
            key,
          }),
        );
        setBaselines({
          key,
          lw: lw.error === 0 ? (lw.items ?? []) : [],
          ly: ly.error === 0 ? (ly.items ?? []) : [],
        });
      })
      .catch((err: JsonError) => live && toast.error(err.message))
      .finally(() => live && dispatch(setTopItemsLoading(false)));
    return () => {
      live = false;
    };
  }, [key, haveRows, haveBase]);

  // A code from the last store is not a code in this one.
  useEffect(() => {
    setSelectedCode(null);
    setDetail(null);
  }, [key]);

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

  const ranked: TopItemCompared[] = useMemo(() => {
    if (!haveRows) return [];
    const top = rankBySales(topItems, TOP_ITEMS_SHOWN);
    return compareWindows(top, baselines?.lw ?? [], baselines?.ly ?? []);
  }, [topItems, haveRows, baselines]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (r) =>
        r.ty.product_description.toLowerCase().includes(q) ||
        r.ty.product_code.includes(q),
    );
  }, [ranked, search]);

  const selected =
    ranked.find((r) => r.ty.product_code === selectedCode) ?? null;

  const points = useMemo(
    () => (selected ? pointsFor(topItemPoints, selected.ty.product_code) : []),
    [selected, topItemPoints],
  );

  const insight = selected ? topItemInsight(selected.ty, points) : null;

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

  /** The supporting metrics: every row TY, LW, LY. */
  const metricRows = !selected
    ? []
    : [
        {
          label: "Units",
          ty: selected.ty.qty.toLocaleString(),
          lw: pctText(deltaPct(selected.ty.qty, selected.lw?.qty)),
          ly: pctText(deltaPct(selected.ty.qty, selected.ly?.qty)),
        },
        {
          label: "Margin",
          ty:
            selected.ty.margin === null
              ? "—"
              : `${selected.ty.margin.toFixed(1)}%`,
          lw: pointsText(deltaPoints(selected.ty.margin, selected.lw?.margin)),
          ly: pointsText(deltaPoints(selected.ty.margin, selected.ly?.margin)),
        },
        {
          label: "Avg price",
          ty: money(avgPrice(selected.ty)),
          lw: pctText(
            deltaPct(
              avgPrice(selected.ty),
              selected.lw ? avgPrice(selected.lw) : null,
            ),
          ),
          ly: pctText(
            deltaPct(
              avgPrice(selected.ty),
              selected.ly ? avgPrice(selected.ly) : null,
            ),
          ),
        },
        {
          label: "On promo",
          ty: `${Math.round(promoShare(selected.ty) * 100)}%`,
          lw: pointsText(
            selected.lw
              ? (promoShare(selected.ty) - promoShare(selected.lw)) * 100
              : null,
          ),
          ly: pointsText(
            selected.ly
              ? (promoShare(selected.ty) - promoShare(selected.ly)) * 100
              : null,
          ),
        },
      ];

  /** The price-mix bar. Every count goes through `count` — these arrive null
   *  rather than zero whenever an item never rang that way. */
  const mix = selected
    ? (() => {
        const r = selected.ty;
        const regular = count(r.qty_regular);
        const promo = count(r.qty_promo);
        const deal = count(r.qty_deal_item);
        const known = regular + promo + deal;
        const w = (n: number) => (known > 0 ? `${(n / known) * 100}%` : "0%");
        return {
          regular: w(regular),
          promo: w(promo),
          deal: w(deal),
          regularN: regular,
          promoN: promo,
          dealN: deal,
        };
      })()
    : null;

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
          <span className="w-[68px] text-right text-[11.5px] font-semibold uppercase tracking-wide text-content/80 pl-2.5">
            Sales
          </span>
          <span className="w-[56px] text-center text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
            vs LW
          </span>
          <span className="w-[56px] text-center text-[11.5px] font-semibold uppercase tracking-wide text-content/80">
            vs LY
          </span>
        </div>

        <div className="overflow-y-auto thin-scrollbar flex-1">
          {shown.map((r) => {
            const tone = topItemInsight(
              r.ty,
              pointsFor(topItemPoints, r.ty.product_code),
            ).tone;
            const isSel = selectedCode === r.ty.product_code;
            return (
              <button
                key={r.ty.product_code}
                onClick={() => setSelectedCode(isSel ? null : r.ty.product_code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
                  isSel
                    ? "bg-row_selected border-row_selected_border"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass(tone)}`}
                />
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-[12px] font-medium text-content truncate"
                    title={r.ty.product_description}
                  >
                    {r.ty.product_description}
                  </span>
                  <span className="block text-[10.5px] text-content/85 tabular-nums">
                    {r.ty.product_code} · {r.ty.qty.toLocaleString()} units
                  </span>
                </span>
                <span className="w-[68px] text-right text-[12px] font-semibold text-content tabular-nums flex-shrink-0 pl-2.5">
                  {money(r.ty.total_sales)}
                </span>
                <span
                  className={`w-[56px] flex-shrink-0 text-center text-[12px] font-semibold px-1.5 py-1 rounded whitespace-nowrap ${pillClass(r.vsLW, threshold)}`}
                >
                  {pctText(r.vsLW)}
                </span>
                <span
                  className={`w-[56px] flex-shrink-0 text-center text-[12px] font-semibold px-1.5 py-1 rounded whitespace-nowrap ${pillClass(r.vsLY, threshold)}`}
                >
                  {pctText(r.vsLY)}
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
        {!selected || !insight ? (
          <div className="flex items-center justify-center h-full text-[12px] text-content px-8 text-center">
            Pick an item to see how it rang and what it costs you.
          </div>
        ) : (
          <>
            <div
              className={`flex-shrink-0 px-4 py-2.5 border-b border-gray-100 ${ctaTone(insight.tone).bg}`}
            >
              <div
                className={`flex items-baseline justify-between gap-3 ${ctaTone(insight.tone).text}`}
              >
                <span className="text-[12px] font-semibold truncate">
                  {selected.ty.product_description}
                  <span className="font-normal tabular-nums opacity-90 ml-1.5">
                    {selected.ty.product_code}
                  </span>
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide flex-shrink-0">
                  {insight.label}
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed mt-1 ${ctaTone(insight.tone).text}`}
              >
                {insight.detail}
              </p>
            </div>

            {/* Lead card + supporting metrics, 40/60 */}
            <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100">
              <div className="grid grid-cols-[40%_1fr] gap-2">
                <div className="rounded-md border border-brand_navy/15 shadow-sm bg-gray-50 p-2.5 text-center flex flex-col justify-center">
                  <div className="text-[11px] font-semibold text-content">
                    Sales
                  </div>
                  <div className="text-[18px] font-semibold text-content leading-tight">
                    {money(selected.ty.total_sales)}
                  </div>
                  <div className="text-[11.5px] font-semibold text-content/85 tabular-nums">
                    {selected.ty.qty.toLocaleString()} units
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-gray-200">
                    {(
                      [
                        [
                          "vs LW",
                          selected.lw?.total_sales ?? null,
                          selected.vsLW,
                        ],
                        [
                          "vs LY",
                          selected.ly?.total_sales ?? null,
                          selected.vsLY,
                        ],
                      ] as const
                    ).map(([label, prior, pct]) => (
                      <div key={label}>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-content">
                          {label}
                        </div>
                        <div className="text-[12px] font-semibold text-content tabular-nums">
                          {money(prior)}
                        </div>
                        <div className="flex justify-center mt-0.5">
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pillClass(pct, threshold)}`}
                          >
                            {pctText(pct)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-brand_navy/15 shadow-sm bg-gray-50 px-2.5 py-1 flex flex-col justify-center">
                  <div className="grid grid-cols-[1fr_56px_55px_55px] gap-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-content">
                    <span />
                    <span className="text-right">TY</span>
                    <span className="text-right">LW</span>
                    <span className="text-right">LY</span>
                  </div>
                  {metricRows.map((m) => (
                    <div
                      key={m.label}
                      className="grid grid-cols-[1fr_56px_55px_55px] gap-1.5 items-center py-1 border-t border-gray-200 text-[11.5px]"
                    >
                      <span className="font-semibold text-content truncate">
                        {m.label}
                      </span>
                      <span className="text-[12px] font-semibold text-content text-right tabular-nums">
                        {m.ty}
                      </span>
                      <span className="text-[12px] font-semibold text-content text-right tabular-nums">
                        {m.lw}
                      </span>
                      <span className="text-[12px] font-semibold text-content text-right tabular-nums">
                        {m.ly}
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
                    {points.length} price point
                    {points.length === 1 ? "" : "s"}
                  </span>
                </div>

                {mix && (
                  <>
                    <div className="flex h-2.5 rounded-sm overflow-hidden bg-bkg">
                      <span
                        className="bg-brand_navy"
                        style={{ width: mix.regular }}
                      />
                      <span
                        className="bg-severity_watch_text"
                        style={{ width: mix.promo }}
                      />
                      <span
                        className="bg-severity_healthy_text"
                        style={{ width: mix.deal }}
                      />
                    </div>
                    <div className="flex gap-4 mt-1.5 text-[11.5px] text-content">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-brand_navy" />
                        Regular {mix.regularN.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-severity_watch_text" />
                        Promo {mix.promoN.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-severity_healthy_text" />
                        Deal {mix.dealN.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-[1fr_64px_80px] gap-2 mt-2.5 pb-1 border-b border-brand_navy/15 text-[11px] font-semibold uppercase tracking-wide text-content/85">
                  <span>Rang at</span>
                  <span className="text-right">Units</span>
                  <span className="text-right">Sales</span>
                </div>
                {points.length === 0 ? (
                  <p className="text-[11px] text-content/85 pt-1.5">
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

              {/* What it costs you */}
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
                  {[...detail.cost_history].reverse().map((h) => (
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
                      {/* Green is the allowance. The endpoint returns it as its
                          own field, but it IS list minus paid, so a third
                          column would say the same thing twice. */}
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
    </div>
  );
};

export default PopupTopItems;
