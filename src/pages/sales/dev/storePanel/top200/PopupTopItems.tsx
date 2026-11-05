// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useSalesCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  restoreTopItems,
  setTopItems,
  setTopItemsLoading,
} from "../../../../../features/dev/devSalesLedgerSlice";

// API
import {
  getItemDetail,
  getTopItems,
  COST_HISTORY_DAYS,
  TOP_ITEMS_FETCH,
  TOP_ITEMS_SHOWN,
  type ItemDetailResponse,
  type TopItemsResponse,
} from "../../../../../api/topItems";

// Utils
import {
  compareWindows,
  deptName,
  deptOptions,
  deptRollups,
  contributionOf,
  topItemsTotals,
  pointsFor,
  displayVerdict,
  marginAt,
  rankHistory,
  rankIn,
  retailMix,
  topPriceOf,
  unitCost,
  rankBySales,
  sortTopItems,
  DEFAULT_TOP_ITEM_SORT,
  topItemInsight,
  type TopItemSort,
  type TopItemCompared,
} from "./utils/topItems";
import { dayText, pctText } from "./utils";

// Interfaces
import type { JsonError } from "../../../../../interfaces";

// Components
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import ItemListToolbar from "./components/ItemListToolbar";
import ItemListHead from "./components/ItemListHead";
import ItemRows from "./components/ItemRows";
import TotalsStrip from "./components/TotalsStrip";
import DeptShareList from "./components/DeptShareList";
import ItemCta from "./components/ItemCta";
import ItemIdentity from "./components/ItemIdentity";
import ItemRetail from "./components/ItemRetail";
import ItemCost from "./components/ItemCost";
import ItemBuyCost from "./components/ItemBuyCost";
import ItemHistory from "./components/ItemHistory";
import ItemDisplay from "./components/ItemDisplay";
import InvoicesButton from "./components/InvoicesButton";
import InvoicesRail from "./components/InvoicesRail";

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
  /** yyyy-mm-dd. The week the popup is showing, and its two baselines; or
   *  one picked day (start === end), against the same weekday last week and
   *  last year. */
  start: string;
  end: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
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
  } = useSalesCtx();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TopItemSort>(DEFAULT_TOP_ITEM_SORT);
  const [dept, setDept] = useState("");
  /** One picked day or the week, as the headings name it. */
  const oneDay = start === end;
  const periodLabel = oneDay ? dayText(start) : "This week";
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
  const landing = useMemo(() => {
    const byMoney = [...rollups].sort((a, b) => b.ty - a.ty);
    // Every department, biggest first: the list is short enough to read
    // whole, and a tail folded into "8 more" hid where the rest went.
    return {
      shown: byMoney,
      // The bar runs against the biggest department, not against the whole
      // list: scaled to the total, most of the bars would be stubs.
      top: byMoney.length ? byMoney[0].ty : 0,
      total: byMoney.reduce((n, d) => n + d.ty, 0),
    };
  }, [rollups]);

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
        <div className="w-[471px] flex-shrink-0 flex flex-col border-r border-gray-100">
          <ItemListToolbar
            search={search}
            setSearch={setSearch}
            dept={dept}
            setDept={setDept}
            depts={depts}
            shown={shown}
            ranked={ranked}
          />

          <ItemListHead sort={sort} setSort={setSort} />

          <ItemRows
            shown={shown}
            topItemPoints={topItemPoints}
            selectedCode={selectedCode}
            setSelectedCode={setSelectedCode}
          />
        </div>

        {/* The selected item */}
        <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          {!selected || !insight ? (
            /* Nothing picked: where the week's money came from, by department.
             Rolled up from the rows already on screen, so it costs no call
             and cannot disagree with the list beside it. */
            <div className="flex flex-col h-full min-h-0">
              <TotalsStrip
                oneDay={oneDay}
                start={start}
                end={end}
                lwStart={lwStart}
                lwEnd={lwEnd}
                lyStart={lyStart}
                lyEnd={lyEnd}
                totals={totals}
                share={share}
              />

              <DeptShareList landing={landing} dept={dept} setDept={setDept} />
            </div>
          ) : (
            <>
              {/* The Sub dept tab's strip, to the letter: icon, name, the
                word for what it is, a chevron, and the sentence as an overlay
                rather than inline — so opening it cannot push the cards
                below out from under the reader's cursor. */}
              <ItemCta
                insight={insight}
                selected={selected}
                folded={folded}
                fold={fold}
              />

              {/* The whole report scrolls as one. The sections below answer
                  different questions and a reader works down them; pinning
                  the top three and scrolling the rest only moved the seam. */}
              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                {/* Identity, and how much of the list this is. Contribution
                    sits here rather than in a tile of its own: the figure,
                    the money and the bar fit on one line, and a third tile
                    would have cost a quarter of the panel. */}
                <ItemIdentity
                  selected={selected}
                  rank={rank}
                  count={ranked.length}
                  shareOfTop={shareOfTop}
                />

                {/* 1 — what retail is actually selling it. First because
                    "all on ad at $11.99" explains a negative margin far more
                    often than the cost does. */}
                <ItemRetail
                  selected={selected}
                  mix={mix}
                  points={points}
                  topPrice={topPrice}
                />

                {/* 2 — is the cost and the retail right. */}
                <ItemCost
                  selected={selected}
                  points={points}
                  mix={mix}
                  detail={detail}
                  perUnitCost={perUnitCost}
                  topPrice={topPrice}
                  topMargin={topMargin}
                />

                {/* What it costs to buy, with the cost it compares
                    against directly above it. */}
                <ItemBuyCost detail={detail} detailLoading={detailLoading} />

                {/* 3 — is any of this new. An item that has sat at #40 all
                    year is a different conversation from one that arrived
                    this week, and that has to be said before anybody reads
                    the margin above. */}
                <ItemHistory
                  history={history}
                  periodLabel={periodLabel}
                  selected={selected}
                />

                {/* 4 — should it be on display. Three readings it can make
                    and one it cannot. */}
                <ItemDisplay display={display} />

                {/* The way into the invoices. They were a folded section
                    under the cost cards; seventeen rows of a weekly-delivered
                    item pushed everything above them off the panel, and the
                    reader opening it is asking a different question from the
                    one the panel answers. */}
                {detail && detail.cost_history.length > 0 && (
                  <InvoicesButton
                    detail={detail}
                    setInvoicesOpen={setInvoicesOpen}
                  />
                )}
              </div>
            </>
          )}

          {/* The invoices, over the panel rather than inside it.
              Mounted whether or not it is open, so it slides instead of
              appearing -- and inert while closed, so tabbing cannot land in
              a panel nobody can see. */}
          <InvoicesRail
            invoicesOpen={invoicesOpen}
            setInvoicesOpen={setInvoicesOpen}
            selected={selected}
            detail={detail}
          />
        </div>
      </div>
    </div>
  );
};

export default PopupTopItems;
