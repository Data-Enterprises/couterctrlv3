import { useEffect, useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  restoreTopItems,
  setTopItems,
  setTopItemsLoading,
} from "../../../../features/dev/devSalesLedgerSlice";
import {
  getItemDetail,
  getTopItems,
  COST_HISTORY_DAYS,
  TOP_ITEMS_FETCH,
  TOP_ITEMS_SHOWN,
  type ItemDetailResponse,
  type TopItemsResponse,
} from "../../../../api/topItems";
import {
  avgPrice,
  compareWindows,
  deptName,
  deptOptions,
  deptRollups,
  deptSeverity,
  deptSeverityCounts,
  amountOf,
  amountText,
  contributionGap,
  deptAmountText,
  contributionOf,
  weighed,
  topItemsTotals,
  deltaPct,
  deltaPoints,
  pointsFor,
  displayVerdict,
  grossProfit,
  marginAt,
  rankHistory,
  rankIn,
  retailMix,
  retailSays,
  topPriceOf,
  unitCost,
  rankBySales,
  sortTopItems,
  nextTopItemSort,
  DEFAULT_TOP_ITEM_SORT,
  topItemInsight,
  type TopItemSort,
  type TopItemSortCol,
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
import SeverityBadge from "../../../../components-dev/SeverityBadge";
import { formatCurrency2 } from "../../../../utils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";

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
 * The CTA palette for an ungraded row: no verdict, so no severity colour.
 * Same definition the Sub dept tab uses, for the same reason.
 */
const NEUTRAL_CTA = {
  border: "border-gray-200",
  bg: "bg-gray-50",
  hoverBg: "hover:bg-gray-100",
  text: "text-content",
};

/** `unknown` is this tab's own and is not a severity: an item whose margin
 *  the server withheld has not been graded badly, it has not been graded. */
const ctaClasses = (tone: ItemTone) =>
  tone === "unknown" ? NEUTRAL_CTA : CTA_SEVERITY_CLASSES[tone as Severity];

const CtaIcon = ({ tone, cls }: { tone: ItemTone; cls: string }) => {
  if (tone === "critical") return <ExclamationTriangleIcon className={cls} />;
  if (tone === "watch") return <ExclamationCircleIcon className={cls} />;
  if (tone === "healthy") return <CheckCircleIcon className={cls} />;
  return null;
};

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

/**
 * Keys with a request already in the air.
 *
 * The slice's loading flag cannot do this job. It is read from the render
 * that scheduled the effect, so a second run scheduled from that same render
 * sees the value it had BEFORE the first run dispatched — and development
 * does exactly that: StrictMode mounts, unmounts and mounts again, so the tab
 * asked for all three windows twice on every open.
 *
 * It lives outside React because it has to survive the remount it exists to
 * absorb, and it is keyed by store-and-week so two different stores still
 * fetch independently.
 */
const inFlight = new Set<string>();

const PopupTopItems = ({
  storeId,
  locations,
  netSales,
  start,
  end,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
  threshold,
}: {
  storeId: number;
  /** Every store_number under this storeid. More than one means co-located
   *  stores, which this endpoint cannot tell apart. */
  locations: string[];
  /**
   * The store's own net sales for each of the three periods, whole week.
   *
   * The tiles report the top 200 as a SHARE of these rather than comparing
   * their dollars: a week up 10% lifts the top 200 with it, and a tile that
   * says +10% then reads as a change in the list when nothing about the list
   * moved.
   */
  netSales: { ty: number; lw: number | null; ly: number | null };
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
  const {
    topItems,
    topItemPoints,
    topItemsLW,
    topItemsLY,
    topItemsKey,
    topItemsLoading,
    topItemsCache,
  } = useAppSelector((state) => state.dev.salesLedger);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TopItemSort>(DEFAULT_TOP_ITEM_SORT);
  const [dept, setDept] = useState("");
  /** The landing report's own chip filter, over departments. */
  const [deptSev, setDeptSev] = useState<Severity | "all">("all");
  /**
   * The CTA strip's open state, and nothing else now that the report has no
   * folding sections.
   *
   * It starts CLOSED, the way the Sub dept tab's does: its label already
   * says the verdict, and the sentence is the working behind it.
   */
  const [folded, setFolded] = useState<Set<string>>(() => new Set(["cta"]));
  const fold = (id: string) =>
    setFolded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  /** The invoices rail. Closed on arrival and on every change of item: a
   *  different item's invoices are a different list, and leaving it open
   *  would show new rows under a heading opened for the old one. */
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [detail, setDetail] = useState<ItemDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const key = `${storeId}__${start}__${end}`;
  const haveRows = topItemsKey === key;

  /**
   * All three windows at once.
   *
   * This week's rows and its price points go to the slice, so switching to
   * Hourly and back does not refetch. The baselines stay local: they are only
   * ever two columns on this tab.
   */
  useEffect(() => {
    if (haveRows || inFlight.has(key)) return;
    // Held from an earlier visit to this store and week: three calls saved,
    // and the tab paints on this tick rather than after three round trips.
    // The baselines ride in the same entry, so a hit serves the comparisons
    // too -- restoring the rows alone would send all three out again.
    if (topItemsCache[key]) {
      dispatch(restoreTopItems(key));
      return;
    }
    inFlight.add(key);
    dispatch(setTopItemsLoading(true));
    Promise.all([
      getTopItems(url, token, storeId, start, end, TOP_ITEMS_FETCH),
      getTopItems(url, token, storeId, lwStart, lwEnd, TOP_ITEMS_FETCH),
      getTopItems(url, token, storeId, lyStart, lyEnd, TOP_ITEMS_FETCH),
    ])
      .then(([tyResp, lwResp, lyResp]) => {
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
            key,
            data: {
              rows: ty.items ?? [],
              points: ty.price_points ?? [],
              lw: lw.error === 0 ? (lw.items ?? []) : [],
              ly: ly.error === 0 ? (ly.items ?? []) : [],
            },
          }),
        );
      })
      .catch((err: JsonError) => toast.error(err.message))
      // The result is written to the slice under its own key, so it stays
      // useful whether or not this tab is still mounted -- which is what
      // lets the request outlive a remount instead of being abandoned by it.
      .finally(() => {
        inFlight.delete(key);
        dispatch(setTopItemsLoading(false));
      });
  }, [key, haveRows]);

  /*
   * The rail closes when the item changes, and on Escape.
   *
   * A different item's invoices are a different list. Leaving it open would
   * put the new item's rows under a heading the reader opened for the old
   * one, which is worse than closing something they wanted open.
   */
  useEffect(() => {
    setInvoicesOpen(false);
  }, [selectedCode]);

  useEffect(() => {
    if (!invoicesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The popup behind this closes on Escape too, and the reader means the
      // thing in front of them.
      e.stopPropagation();
      setInvoicesOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [invoicesOpen]);

  // A code from the last store is not a code in this one.
  useEffect(() => {
    setSelectedCode(null);
    setDetail(null);
    setDept("");
    setDeptSev("all");
  }, [key]);

  useEffect(() => {
    if (!selectedCode) {
      setDetail(null);
      return;
    }
    let live = true;
    setDetailLoading(true);
    setDetail(null);
    getItemDetail(
      url,
      token,
      storeId,
      selectedCode,
      start,
      end,
      COST_HISTORY_DAYS,
    )
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
    return compareWindows(top, topItemsLW, topItemsLY);
  }, [topItems, haveRows, topItemsLW, topItemsLY]);

  const depts = useMemo(() => deptOptions(ranked), [ranked]);

  /** The landing report. Rolled up from the rows on screen, so it costs no
   *  call and cannot disagree with the list beside it. */
  const rollups = useMemo(() => deptRollups(ranked), [ranked]);
  const totals = useMemo(() => topItemsTotals(ranked), [ranked]);

  /** The share of each period's week these items carried. */
  const share = useMemo(
    () => ({
      ty: contributionOf(totals.ty, netSales.ty),
      lw: contributionOf(totals.lw, netSales.lw),
      ly: contributionOf(totals.ly, netSales.ly),
    }),
    [totals, netSales],
  );
  const sevCounts = useMemo(
    () => deptSeverityCounts(rollups, threshold),
    [rollups, threshold],
  );
  const shownDepts = useMemo(
    () =>
      deptSev === "all"
        ? rollups
        : rollups.filter((d) => deptSeverity(d, threshold) === deptSev),
    [rollups, deptSev, threshold],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = ranked.filter((r) => {
      if (dept && deptName(r.ty) !== dept) return false;
      if (!q) return true;
      return (
        r.ty.product_description.toLowerCase().includes(q) ||
        r.ty.product_code.includes(q)
      );
    });
    return sortTopItems(matched, sort);
  }, [ranked, search, sort, dept]);

  const selected =
    ranked.find((r) => r.ty.product_code === selectedCode) ?? null;

  const points = useMemo(
    () => (selected ? pointsFor(topItemPoints, selected.ty.product_code) : []),
    [selected, topItemPoints],
  );

  const insight = selected ? topItemInsight(selected.ty, points) : null;

  /** Where it sits in the list, and how much of the list it is. */
  const rank = selected
    ? ranked.findIndex((r) => r.ty.product_code === selected.ty.product_code) +
      1
    : 0;
  const shareOfTop =
    selected && totals.ty > 0
      ? (selected.ty.total_sales / totals.ty) * 100
      : null;

  /*
   * The headline price.
   *
   * One price point IS the price — read it off the row rather than dividing
   * sales by amount, which only lands on the same number when nothing moved
   * all week. With several, the blended average is the honest single figure
   * and the ladder below shows what it is blending.
   */
  const headlinePrice =
    points.length === 1
      ? points[0].price
      : selected
        ? avgPrice(selected.ty)
        : null;

  const perUnitCost = selected ? unitCost(selected.ty) : null;

  /** What kind of retail sold it, this week's rank history, and whether it
   *  is worth a display. All of it off rows already in hand. */
  const mix = useMemo(
    () => (selected ? retailMix(selected.ty) : null),
    [selected],
  );
  const topPrice = useMemo(() => topPriceOf(points), [points]);
  const topMargin = useMemo(
    () => marginAt(topPrice, perUnitCost),
    [topPrice, perUnitCost],
  );

  const history = useMemo(() => {
    if (!selected) return rankHistory(null, null, null);
    const code = selected.ty.product_code;
    return rankHistory(
      rank || null,
      rankIn(topItemsLW, code, TOP_ITEMS_SHOWN),
      rankIn(topItemsLY, code, TOP_ITEMS_SHOWN),
    );
  }, [selected, rank, topItemsLW, topItemsLY]);

  const display = useMemo(
    () =>
      selected
        ? displayVerdict(
            rank || null,
            selected.ty.margin,
            selected.vsLW,
            !selected.lw,
            pctText,
          )
        : displayVerdict(null, null, null, false, pctText),
    [selected, rank],
  );

  if (topItemsLoading && !haveRows) {
    return (
      <div className="relative h-full">
        <LoadingIndicator message="Loading top items" />
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

  /** The supporting metrics: every row TY, and against each baseline. */
  const metricRows = !selected
    ? []
    : [
        {
          label: "Sales",
          ty: money(selected.ty.total_sales),
          lw: pctText(selected.vsLW),
          ly: pctText(selected.vsLY),
        },
        {
          label: weighed(selected.ty) ? "Pounds" : "Units",
          ty: amountText(selected.ty),
          lw: pctText(
            deltaPct(
              amountOf(selected.ty),
              selected.lw ? amountOf(selected.lw) : undefined,
            ),
          ),
          ly: pctText(
            deltaPct(
              amountOf(selected.ty),
              selected.ly ? amountOf(selected.ly) : undefined,
            ),
          ),
        },
        {
          label: weighed(selected.ty) ? "Price per lb" : "Avg price",
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
          label: "Margin",
          ty:
            selected.ty.margin === null
              ? "—"
              : `${selected.ty.margin.toFixed(1)}%`,
          lw: pointsText(deltaPoints(selected.ty.margin, selected.lw?.margin)),
          ly: pointsText(deltaPoints(selected.ty.margin, selected.ly?.margin)),
        },
        {
          label: "Gross profit",
          ty: money(grossProfit(selected.ty)),
          lw: pctText(
            deltaPct(
              grossProfit(selected.ty),
              selected.lw ? grossProfit(selected.lw) : null,
            ),
          ),
          ly: pctText(
            deltaPct(
              grossProfit(selected.ty),
              selected.ly ? grossProfit(selected.ly) : null,
            ),
          ),
        },
      ];

  const perUnitMargin =
    headlinePrice !== null && perUnitCost !== null
      ? headlinePrice - perUnitCost
      : null;

  /** A column heading that sorts. Chevron only on the column in force, the
   *  way every other grid on this page marks it. */
  const SortHead = ({
    col,
    className,
    children,
  }: {
    col: TopItemSortCol;
    className: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => setSort((cur) => nextTopItemSort(cur, col))}
      className={`flex items-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0 ${className}`}
    >
      {children}
      {sort.column === col &&
        (sort.direction === "desc" ? (
          <ChevronDownIcon className="w-3 h-3" />
        ) : (
          <ChevronUpIcon className="w-3 h-3" />
        ))}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/*
        Co-located stores share one storeid, and `sales/topitems` reads by
        storeid alone — there is no store_number on the request, so this tab
        answers for every location under that id at once. The totals above it
        are one location, and the two figures contradict each other on screen.
        Said outright until the endpoint can take a store number: the fix is
        not available here, because the top 200 was ranked across both
        locations before it arrived, and filtering the rows afterwards would
        leave an arbitrary subset rather than this store's own top 200.
      */}
      {locations.length > 1 && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-severity_watch_bg text-severity_watch_text text-[11.5px] leading-snug border-b border-severity_watch_text/25">
          <span className="font-semibold">
            Both locations: {locations.join(" and ")}.
          </span>{" "}
          They share one store id and this tab reads by store id, so it cannot
          be narrowed to one of them — the figures above the tabs are this
          location alone.
        </div>
      )}

      <div className="flex flex-1 min-h-0">
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
            {depts.length > 1 && (
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                aria-label="Filter by sub department"
                className="text-[11.5px] px-1.5 py-1 rounded-md border border-gray-200 bg-custom-white text-content max-w-[130px]"
              >
                <option value="">All sub depts</option>
                {depts.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}
            <span className="text-[10px] font-semibold text-content/85 whitespace-nowrap">
              {shown.length === ranked.length
                ? `Top ${Math.min(ranked.length, TOP_ITEMS_SHOWN)} by sales`
                : `${shown.length} of ${ranked.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="w-2.5 flex-shrink-0" />
            <SortHead col="item" className="flex-1 min-w-0 justify-start">
              Item
            </SortHead>
            <SortHead col="sales" className="w-[68px] justify-end pl-2.5">
              Sales
            </SortHead>
            <SortHead col="vsLW" className="w-[56px] justify-center">
              vs LW
            </SortHead>
            <SortHead col="vsLY" className="w-[56px] justify-center">
              vs LY
            </SortHead>
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
                  onClick={() =>
                    setSelectedCode(isSel ? null : r.ty.product_code)
                  }
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
                    <span
                      className="block text-[10.5px] text-content/85 tabular-nums truncate"
                      title={`${r.ty.product_code} · ${deptName(r.ty)} · ${amountText(r.ty)}`}
                    >
                      {r.ty.product_code} · {deptName(r.ty)} ·{" "}
                      {amountText(r.ty)}
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
        <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          {!selected || !insight ? (
            /* Nothing picked: where the week's money came from, by department.
             Rolled up from the rows already on screen, so it costs no call
             and cannot disagree with the list beside it. */
            <div className="flex flex-col h-full min-h-0">
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="px-4 pt-2.5 pb-2 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                    Top 200 Sales
                  </div>
                  <div className="text-[10px] font-bold text-content mb-0.5">
                    {dayText(start)} &ndash; {dayText(end)}
                  </div>
                  <div className="text-[14px] font-bold text-content tabular-nums">
                    {money(totals.ty)}
                  </div>
                  <div className="text-[11.5px] text-content/85 tabular-nums">
                    {share.ty === null
                      ? "—"
                      : `${share.ty.toFixed(1)}% of net sales`}
                  </div>
                </div>
                {(
                  [
                    [
                      "vs Last Week",
                      lwStart,
                      lwEnd,
                      totals.lw,
                      share.lw,
                      contributionGap(share.ty, share.lw),
                    ],
                    [
                      "vs Last Year",
                      lyStart,
                      lyEnd,
                      totals.ly,
                      share.ly,
                      contributionGap(share.ty, share.ly),
                    ],
                  ] as const
                ).map(([label, from, to, value, pct, gap]) => (
                  <div key={label} className="px-4 pt-2.5 pb-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                      {label}
                    </div>
                    <div className="text-[10px] font-bold text-content mb-0.5">
                      {dayText(from)} &ndash; {dayText(to)}
                    </div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-[14px] font-bold text-content tabular-nums">
                        {money(value)}
                      </span>
                      {/* Points of contribution, not a change in dollars. It
                          is a direction, not a grade: a threshold built for a
                          sales percentage would call three points of share a
                          rounding error. */}
                      {gap !== null && (
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            gap > 0
                              ? "bg-delta_positive_bg text-delta_positive_text"
                              : gap < 0
                                ? "bg-delta_negative_bg text-delta_negative_text"
                                : "bg-gray-100 text-content"
                          }`}
                        >
                          {`${gap > 0 ? "+" : gap < 0 ? "−" : ""}${Math.abs(gap).toFixed(1)}%`}
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-content/85 tabular-nums">
                      {pct === null ? "—" : `${pct.toFixed(1)}% of net sales`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chips count DEPARTMENTS, not items. This report is about where
                the money sat; item grades are already the dots down the
                left. */}
              <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 bg-gray-100 border-b border-gray-100 flex-shrink-0">
                {(
                  [
                    [
                      "critical",
                      "Crit",
                      "bg-severity_critical_bg text-severity_critical_text",
                      "ring-severity_critical_text/40",
                    ],
                    [
                      "watch",
                      "Watch",
                      "bg-severity_watch_bg text-severity_watch_text",
                      "ring-severity_watch_text/40",
                    ],
                    [
                      "healthy",
                      "OK",
                      "bg-severity_healthy_bg text-severity_healthy_text",
                      "ring-severity_healthy_text/40",
                    ],
                  ] as const
                ).map(([sev, label, cls, ring]) => (
                  <button
                    key={sev}
                    onClick={() => setDeptSev((f) => (f === sev ? "all" : sev))}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-shadow ${cls} ${
                      deptSev === sev ? `ring-2 ${ring} shadow-sm` : ""
                    }`}
                  >
                    {label} ({sevCounts[sev]})
                  </button>
                ))}
                <span className="flex-1" />
                <span className="text-[10px] font-semibold text-content/85">
                  {rollups.length} sub department
                  {rollups.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
                <span className="w-[18px] flex-shrink-0" />
                <span className="flex-1 min-w-0 text-[11px] font-bold uppercase tracking-wide text-content/85">
                  Where the week&rsquo;s money came from
                </span>
                <span className="w-[86px] text-center text-[11px] font-bold uppercase tracking-wide text-content/85">
                  TY
                </span>
                <span className="w-[78px] text-center text-[11px] font-bold uppercase tracking-wide text-content/85">
                  LW
                </span>
                <span className="w-[78px] text-center text-[11px] font-bold uppercase tracking-wide text-content/85">
                  LY
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                {shownDepts.map((d) => {
                  const sev = deptSeverity(d, threshold);
                  return (
                    <button
                      key={d.name}
                      onClick={() => setDept(d.name)}
                      title={`Narrow the list to ${d.name}`}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <SeverityBadge severity={sev} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-content truncate">
                          {d.name}
                        </span>
                        <span className="block text-[11px] text-content/85 tabular-nums truncate">
                          {d.items} item{d.items === 1 ? "" : "s"} &middot;{" "}
                          {Math.round(d.offRegular * 100)}% off regular
                        </span>
                      </span>
                      <span
                        className={`w-[86px] flex-shrink-0 text-center px-1 py-0.5 rounded ${
                          sev
                            ? pillClass(d.vsLY ?? d.vsLW, threshold)
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span className="block text-[13px] font-semibold tabular-nums">
                          {money(d.ty)}
                        </span>
                        <span className="block text-[11px] tabular-nums">
                          {deptAmountText(d)}
                        </span>
                      </span>
                      {(
                        [
                          [d.lw, d.lwUnits],
                          [d.ly, d.lyUnits],
                        ] as const
                      ).map(([value, units], i) => (
                        <span
                          key={i}
                          className="w-[78px] flex-shrink-0 text-center text-content"
                        >
                          <span className="block text-[12px] font-semibold tabular-nums">
                            {money(value)}
                          </span>
                          <span className="block text-[11px] text-content/85 tabular-nums">
                            {units === null
                              ? "—"
                              : `${units.toLocaleString()} u`}
                          </span>
                        </span>
                      ))}
                    </button>
                  );
                })}
                {shownDepts.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-[12px] text-content">
                    No departments at that grade
                  </div>
                )}
              </div>

              <p className="flex-shrink-0 px-3 py-1.5 border-t border-gray-100 text-[10.5px] leading-snug text-content/85">
                Graded on the same threshold as the rest of the page, against
                last year where there is one and last week otherwise. These are
                the top 200&rsquo;s departments, not the store&rsquo;s whole
                week &mdash; Sub depts is that tab. Click one to narrow the list
                to it.
              </p>
            </div>
          ) : (
            <>
              {/* The Sub dept tab's strip, to the letter: icon, name, the
                word for what it is, a chevron, and the sentence as an overlay
                rather than inline — so opening it cannot push the cards
                below out from under the reader's cursor. */}
              <div
                className={`relative flex-shrink-0 border-b ${ctaClasses(insight.tone).border}`}
              >
                <button
                  onClick={() => fold("cta")}
                  className={`w-full flex items-center gap-1.5 px-3 py-1.5 ${ctaClasses(insight.tone).bg} ${ctaClasses(insight.tone).hoverBg} transition-colors`}
                >
                  <CtaIcon
                    tone={insight.tone}
                    cls={`w-3.5 h-3.5 ${ctaClasses(insight.tone).text} flex-shrink-0`}
                  />
                  <span
                    className={`text-[12px] font-semibold truncate ${ctaClasses(insight.tone).text}`}
                  >
                    {selected.ty.product_description}
                  </span>
                  <span
                    className={`text-[12px] font-semibold flex-shrink-0 ${ctaClasses(insight.tone).text}`}
                  >
                    {insight.label}
                  </span>
                  <span className="flex-1" />
                  {folded.has("cta") ? (
                    <ChevronDownIcon
                      className={`w-3 h-3 flex-shrink-0 ${ctaClasses(insight.tone).text}`}
                    />
                  ) : (
                    <ChevronUpIcon
                      className={`w-3 h-3 flex-shrink-0 ${ctaClasses(insight.tone).text}`}
                    />
                  )}
                </button>
                {!folded.has("cta") && (
                  <div
                    className={`absolute top-full left-0 right-0 z-20 px-3 py-2 border-b shadow-lg ${ctaClasses(insight.tone).bg} ${ctaClasses(insight.tone).border}`}
                  >
                    <span
                      className={`text-[11px] leading-relaxed ${ctaClasses(insight.tone).text}`}
                    >
                      {insight.detail}
                    </span>
                  </div>
                )}
              </div>

              {/* The whole report scrolls as one. The sections below answer
                  different questions and a reader works down them; pinning
                  the top three and scrolling the rest only moved the seam. */}
              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                {/* Identity, and how much of the list this is. Contribution
                    sits here rather than in a tile of its own: the figure,
                    the money and the bar fit on one line, and a third tile
                    would have cost a quarter of the panel. */}
                <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
                  <div className="min-w-0 flex-1 text-[11.5px] text-content/85 truncate">
                    <span className="tabular-nums">
                      {selected.ty.product_code}
                    </span>{" "}
                    &middot; {deptName(selected.ty)} &middot;{" "}
                    <span className="font-semibold text-content tabular-nums">
                      #{rank} of {ranked.length}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[13.5px] font-bold text-content tabular-nums leading-tight">
                      {shareOfTop === null
                        ? "\u2014"
                        : `${shareOfTop.toFixed(1)}%`}
                      <span className="text-[11px] font-normal text-content/85">
                        {" "}
                        of top 200
                      </span>
                    </div>
                    <span className="block w-[120px] h-[3px] rounded bg-bkg mt-0.5">
                      <span
                        className="block h-full rounded bg-brand_navy"
                        style={{ width: `${Math.min(100, shareOfTop ?? 0)}%` }}
                      />
                    </span>
                  </div>
                </div>

                {/* 1 — what retail is actually selling it. First because
                    "all on ad at $11.99" explains a negative margin far more
                    often than the cost does. */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div className="text-[14px] font-bold text-content leading-snug">
                    {retailSays(mix, points, money)}
                  </div>

                  {mix && (
                    <>
                      <span className="flex h-2.5 rounded-sm overflow-hidden bg-bkg mt-2">
                        <span
                          className="bg-brand_navy"
                          style={{ width: `${mix.regularPct}%` }}
                        />
                        <span
                          className="bg-severity_watch_text"
                          style={{ width: `${mix.adPct}%` }}
                        />
                        <span
                          className="bg-severity_healthy_text"
                          style={{ width: `${mix.tprPct}%` }}
                        />
                      </span>
                      <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-1.5 text-[11.5px] text-content">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-brand_navy" />
                          Reg {Math.round(mix.regularPct)}%
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-severity_watch_text" />
                          Ad {Math.round(mix.adPct)}%
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-severity_healthy_text" />
                          TPR {Math.round(mix.tprPct)}%
                        </span>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-[1fr_74px_84px] gap-2 mt-2.5 pb-1 border-b border-brand_navy/15 text-[10px] font-bold uppercase tracking-wide text-content/85">
                    <span>Rang at</span>
                    <span className="text-right">
                      {weighed(selected.ty) ? "Pounds" : "Units"}
                    </span>
                    <span className="text-right">Sales</span>
                  </div>
                  {points.length === 0 ? (
                    <p className="text-[11.5px] text-content/85 pt-1.5">
                      No price came back for this item.
                    </p>
                  ) : (
                    points.map((pt) => (
                      <div
                        key={pt.price}
                        className="grid grid-cols-[1fr_74px_84px] gap-2 items-center py-1 border-b border-brand_navy/15 last:border-b-0 text-[11.5px] text-content tabular-nums"
                      >
                        <span className="text-[13px] font-semibold">
                          {money(pt.price)}
                          {weighed(selected.ty) && (
                            <span className="text-[11px] font-normal text-content/85">
                              {" "}
                              /lb
                            </span>
                          )}
                        </span>
                        <span className="text-right">
                          {weighed(selected.ty) && pt.price > 0
                            ? (pt.netSales / pt.price).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 1 },
                              )
                            : pt.units.toLocaleString()}
                        </span>
                        <span className="text-right">{money(pt.netSales)}</span>
                      </div>
                    ))
                  )}
                  {topPrice !== null && (
                    <div className="text-[11.5px] text-content/85 mt-1.5">
                      Its highest price this week:{" "}
                      <span className="font-semibold text-content">
                        {money(topPrice)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2 — is the cost and the retail right. */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div
                    className={`text-[14px] font-bold leading-snug ${
                      perUnitMargin !== null && perUnitMargin < 0
                        ? "text-severity_critical_text"
                        : "text-content"
                    }`}
                  >
                    {perUnitMargin === null
                      ? "Cost is not known for this item"
                      : perUnitMargin < 0
                        ? `Selling at a loss \u2014 ${money(Math.abs(perUnitMargin))} on every ${weighed(selected.ty) ? "pound" : "unit"}`
                        : `Makes ${money(perUnitMargin)} a ${weighed(selected.ty) ? "pound" : "unit"}`}
                  </div>

                  <div className="flex items-baseline justify-between gap-2 mt-2 py-1">
                    <span className="text-[12.5px] text-content truncate">
                      Selling at
                      {mix && mix.adPct >= 50 && (
                        <span className="text-[11px] text-content/85">
                          {" "}
                          (on ad)
                        </span>
                      )}
                    </span>
                    <span className="text-[14px] font-semibold text-content tabular-nums flex-shrink-0">
                      {money(headlinePrice)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1 border-b border-brand_navy/15">
                    <span className="text-[12.5px] text-content truncate">
                      Cost
                      <span className="text-[11px] text-content/85">
                        {" "}
                        &middot;{" "}
                        {detail?.cost_summary
                          ? `last invoice ${dayText(detail.cost_summary.last_bought_on)}`
                          : selected.ty.cost_coverage === null
                            ? "no line carried a cost"
                            : `${Math.round(selected.ty.cost_coverage)}% of lines costed`}
                      </span>
                    </span>
                    <span className="text-[14px] font-semibold text-content tabular-nums flex-shrink-0">
                      {money(perUnitCost)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div
                      className={`rounded-md px-2.5 py-2 ${
                        selected.ty.margin === null
                          ? "bg-gray-100"
                          : selected.ty.margin < 0
                            ? "bg-severity_critical_bg"
                            : "bg-severity_healthy_bg"
                      }`}
                    >
                      <div
                        className={`text-[11px] ${
                          selected.ty.margin === null
                            ? "text-content/85"
                            : selected.ty.margin < 0
                              ? "text-severity_critical_text"
                              : "text-severity_healthy_text"
                        }`}
                      >
                        Margin now
                      </div>
                      <div
                        className={`text-[18px] font-bold tabular-nums leading-tight ${
                          selected.ty.margin === null
                            ? "text-content"
                            : selected.ty.margin < 0
                              ? "text-severity_critical_text"
                              : "text-severity_healthy_text"
                        }`}
                      >
                        {selected.ty.margin === null
                          ? "\u2014"
                          : `${selected.ty.margin.toFixed(1)}%`}
                      </div>
                      <div className="text-[11px] text-content/85">
                        {perUnitMargin === null
                          ? "no cost to compare"
                          : `${perUnitMargin < 0 ? "loses" : "makes"} ${money(Math.abs(perUnitMargin))} per ${weighed(selected.ty) ? "lb" : "unit"}`}
                      </div>
                    </div>

                    {/* Only when it rang at more than one price. With a single
                        price there is no higher one to compare against, and
                        inventing a shelf price it never charged would be a
                        worse answer than none. */}
                    {topPrice !== null && topMargin !== null && (
                      <div className="rounded-md px-2.5 py-2 bg-severity_watch_bg">
                        <div className="text-[11px] text-severity_watch_text truncate">
                          At its top price {money(topPrice)}
                        </div>
                        <div className="text-[18px] font-bold tabular-nums leading-tight text-severity_watch_text">
                          {topMargin.toFixed(1)}%
                        </div>
                        <div className="text-[11px] text-content/85">
                          {perUnitCost === null
                            ? ""
                            : `makes ${money(topPrice - perUnitCost)} per ${weighed(selected.ty) ? "lb" : "unit"}`}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-md ${
                      grossProfit(selected.ty) === null
                        ? "bg-gray-100"
                        : (grossProfit(selected.ty) as number) < 0
                          ? "bg-severity_critical_bg"
                          : "bg-severity_healthy_bg"
                    }`}
                  >
                    <span
                      className={`text-[12.5px] font-semibold truncate ${
                        grossProfit(selected.ty) === null
                          ? "text-content"
                          : (grossProfit(selected.ty) as number) < 0
                            ? "text-severity_critical_text"
                            : "text-severity_healthy_text"
                      }`}
                    >
                      Gross profit
                      <span className="font-normal">
                        {" "}
                        &middot; {amountText(selected.ty)} sold
                      </span>
                    </span>
                    <span
                      className={`text-[17px] font-bold tabular-nums flex-shrink-0 ${
                        grossProfit(selected.ty) === null
                          ? "text-content"
                          : (grossProfit(selected.ty) as number) < 0
                            ? "text-severity_critical_text"
                            : "text-severity_healthy_text"
                      }`}
                    >
                      {money(grossProfit(selected.ty))}
                    </span>
                  </div>
                  {grossProfit(selected.ty) === null && (
                    <p className="text-[11px] text-content/85 mt-1 leading-snug">
                      Too few lines carried a cost to work out a margin worth
                      trusting, so the profit is withheld rather than guessed.
                    </p>
                  )}
                </div>

                {/* What it costs to buy, with the cost it compares
                    against directly above it. */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-content/85">
                      What it costs to buy
                    </span>
                    {detail?.cost_summary && (
                      <span className="text-[11.5px] text-content/85">
                        {detail.cost_summary.purchases} purchase
                        {detail.cost_summary.purchases === 1 ? "" : "s"}{" "}
                        &middot; {COST_HISTORY_DAYS} days
                      </span>
                    )}
                  </div>

                  {detailLoading && (
                    <div className="relative h-20">
                      <LoadingIndicator message="Loading cost history" />
                    </div>
                  )}

                  {!detailLoading && !detail?.cost_summary && (
                    <p className="text-[11.5px] text-content/85 leading-snug mt-1.5">
                      Nothing bought in the last {COST_HISTORY_DAYS} days, so
                      there is no cost history to compare against.
                    </p>
                  )}

                  {detail?.cost_summary && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="rounded-md bg-bkg px-2.5 py-2">
                        <div className="text-[11px] text-content/85">
                          Paying now
                        </div>
                        <div className="text-[14.5px] font-semibold text-content tabular-nums">
                          {money(detail.cost_summary.paying_now)}
                        </div>
                      </div>
                      <div className="rounded-md bg-bkg px-2.5 py-2">
                        <div className="text-[11px] text-content/85 truncate">
                          Best seen &middot;{" "}
                          {dayText(detail.cost_summary.best_seen_on)}
                        </div>
                        <div className="text-[14.5px] font-semibold text-content tabular-nums">
                          {money(detail.cost_summary.best_seen)}
                        </div>
                      </div>
                      {/* Amber only when waiting is worth something: a nought
                          in a warning tint reads as a problem that is not
                          there. */}
                      <div
                        className={`rounded-md px-2.5 py-2 ${
                          detail.cost_summary.gap > 0.0001
                            ? "bg-severity_watch_bg"
                            : "bg-bkg"
                        }`}
                      >
                        <div
                          className={`text-[11px] truncate ${
                            detail.cost_summary.gap > 0.0001
                              ? "text-severity_watch_text"
                              : "text-content/85"
                          }`}
                        >
                          {detail.cost_summary.gap > 0.0001
                            ? "Waiting could save"
                            : "At the best price seen"}
                        </div>
                        <div
                          className={`text-[14.5px] font-semibold tabular-nums ${
                            detail.cost_summary.gap > 0.0001
                              ? "text-severity_watch_text"
                              : "text-content"
                          }`}
                        >
                          {money(detail.cost_summary.gap)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3 — is any of this new. An item that has sat at #40 all
                    year is a different conversation from one that arrived
                    this week, and that has to be said before anybody reads
                    the margin above. */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div className="text-[14px] font-bold text-content leading-snug">
                    {history.says}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(
                      [
                        ["Last year", history.ly],
                        ["Last week", history.lw],
                        ["This week", history.ty],
                      ] as const
                    ).map(([label, at], i) => (
                      <div
                        key={label}
                        className={`rounded-md px-2.5 py-2 ${i === 2 ? "bg-row_selected border border-row_selected_border" : "bg-bkg"}`}
                      >
                        <div className="text-[11px] text-content/85">
                          {label}
                        </div>
                        <div className="text-[13.5px] font-semibold text-content tabular-nums">
                          {at === null ? "not in top 200" : `#${at}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[1fr_84px_62px_62px] gap-1.5 mt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-content/85">
                    <span />
                    <span className="text-right">This week</span>
                    <span className="text-right">vs LW</span>
                    <span className="text-right">vs LY</span>
                  </div>
                  {metricRows.map((m) => (
                    <div
                      key={m.label}
                      className="grid grid-cols-[1fr_84px_62px_62px] gap-1.5 items-center py-1 border-t border-gray-100 text-[11.5px]"
                    >
                      <span className="text-content/85 truncate">
                        {m.label}
                      </span>
                      <span className="text-[12.5px] font-semibold text-content text-right tabular-nums">
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

                  {/* The gap, named. Deliveries are a different endpoint and
                      this tab does not call it; saying so beats a bar that
                      cannot be drawn. */}
                  <p className="text-[11px] text-content/85 mt-1.5 leading-snug">
                    What arrived this week is not read here &mdash; the
                    department investigation reads ordering against sales.
                  </p>
                </div>

                {/* 4 — should it be on display. Three readings it can make
                    and one it cannot. */}
                <div className="px-4 py-2.5">
                  <div
                    className={`text-[14px] font-bold leading-snug ${
                      display.worth
                        ? "text-severity_healthy_text"
                        : "text-severity_critical_text"
                    }`}
                  >
                    {display.says}
                  </div>
                  <div className="mt-1.5">
                    {display.checks.map((c) => (
                      <div
                        key={c.label}
                        className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-b-0 text-[12.5px]"
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                            c.state === "pass"
                              ? "bg-severity_healthy_bg text-severity_healthy_text"
                              : c.state === "fail"
                                ? "bg-severity_critical_bg text-severity_critical_text"
                                : "bg-gray-100 text-content/85"
                          }`}
                          aria-hidden="true"
                        >
                          {c.state === "pass"
                            ? "\u2713"
                            : c.state === "fail"
                              ? "\u2715"
                              : "?"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-content">
                          {c.label}
                        </span>
                        <span className="flex-shrink-0 text-content/85 tabular-nums">
                          {c.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-content/85 mt-1.5 leading-snug">
                    Nothing here says what is on display today &mdash; that one
                    needs a look in the store.
                  </p>
                </div>

                {/* The way into the invoices. They were a folded section
                    under the cost cards; seventeen rows of a weekly-delivered
                    item pushed everything above them off the panel, and the
                    reader opening it is asking a different question from the
                    one the panel answers. */}
                {detail && detail.cost_history.length > 0 && (
                  <button
                    onClick={() => setInvoicesOpen(true)}
                    className="flex items-center gap-2 w-full mx-4 mb-3 px-3 py-2 rounded-md border border-brand_navy/15 bg-custom-white hover:bg-gray-50 transition-colors text-left"
                    style={{ width: "calc(100% - 2rem)" }}
                  >
                    <DocumentTextIcon className="w-4 h-4 flex-shrink-0 text-content/85" />
                    <span className="text-[12.5px] font-semibold text-content">
                      Invoices
                    </span>
                    <span className="text-[11.5px] text-content/85 truncate">
                      {detail.cost_history.length} deliver
                      {detail.cost_history.length === 1 ? "y" : "ies"} ·{" "}
                      {dayText(
                        detail.cost_history[detail.cost_history.length - 1]
                          ?.invoice_date,
                      )}{" "}
                      most recent
                    </span>
                    <span className="flex-1" />
                    <ChevronRightIcon className="w-4 h-4 flex-shrink-0 text-content/85" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* The invoices, over the panel rather than inside it.
              Mounted whether or not it is open, so it slides instead of
              appearing -- and inert while closed, so tabbing cannot land in
              a panel nobody can see. */}
          <div
            aria-hidden={!invoicesOpen}
            className={`absolute inset-y-0 right-0 w-full z-30 flex flex-col bg-custom-white border-l-2 border-brand_navy/25 shadow-rail transition-transform duration-200 ease-out motion-reduce:transition-none ${
              invoicesOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <button
              onClick={() => setInvoicesOpen(false)}
              tabIndex={invoicesOpen ? 0 : -1}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-brand_navy/15 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <ChevronLeftIcon className="w-4 h-4 flex-shrink-0 text-content/85" />
              <span className="text-[12.5px] font-semibold text-content">
                Invoices
              </span>
              <span className="text-[11.5px] text-content/85 truncate">
                {selected?.ty.product_description}
              </span>
              <span className="flex-1" />
              <span className="text-[11.5px] font-semibold text-content/85">
                {detail?.cost_history.length ?? 0}
              </span>
            </button>

            {/* Its own scroll: sixty days of a weekly-delivered item is
                seventeen rows, which is what drove the cost window down from
                120 days in the first place. */}
            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3 py-2">
              <div className="grid grid-cols-[86px_1fr_68px_68px] gap-2 pb-1 border-b border-brand_navy/15 text-[11px] font-semibold uppercase tracking-wide text-content/85">
                <span>Invoice</span>
                <span>Vendor</span>
                <span className="text-right">List</span>
                <span className="text-right">Paid</span>
              </div>
              {[...(detail?.cost_history ?? [])].reverse().map((h) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupTopItems;
