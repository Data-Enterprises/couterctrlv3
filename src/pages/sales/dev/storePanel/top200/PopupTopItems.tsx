// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useSalesCtx } from "../../hooks";
import { useSelectedItem, useTop200View } from "./hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  EMPTY_TOP200_VIEW,
  restoreTopItems,
  setTop200View,
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
  rankBySales,
  type TopItemCompared,
} from "./utils/topItems";
import { dayText, inFlight } from "./utils";
import { reasonOf } from "../../../../../utils/serverError";

// Components
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import ItemCta from "./components/ItemCta";
import InvoicesRail from "./components/InvoicesRail";
import ItemList from "./list/ItemList";
import Top200Landing from "./landing/Top200Landing";
import ItemReport from "./item/ItemReport";

interface PopupTopItemsProps {
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
}

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
}: PopupTopItemsProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const {
    url,
    token,
    topItems,
    topItemsLW,
    topItemsLY,
    topItemsKey,
    topItemsLoading,
    topItemsCache,
  } = useSalesCtx();

  const { selectedCode, detail } = useTop200View();
  const setDetail = (next: typeof detail) =>
    dispatch(setTop200View({ detail: next }));
  const setDetailLoading = (loading: boolean) =>
    dispatch(setTop200View({ detailLoading: loading }));
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
  /** The invoices rail. Closed on arrival and on every change of item: a
   *  different item's invoices are a different list, and leaving it open
   *  would show new rows under a heading opened for the old one. */
  const [invoicesOpen, setInvoicesOpen] = useState(false);
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
      .catch((err) => toast.error(reasonOf(err)))
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
    dispatch(setTop200View({ selectedCode: null, detail: null, dept: "" }));
  }, [key]);

  // The list's state was the tab's own until it moved to the slice; it still
  // goes when the tab closes.
  useEffect(
    () => () => {
      dispatch(setTop200View(EMPTY_TOP200_VIEW));
    },
    [],
  );

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
      .catch((err) => live && toast.error(reasonOf(err)))
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

  const { selected, insight } = useSelectedItem(ranked);

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
        <ItemList ranked={ranked} />

        {/* The selected item */}
        <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          {!selected || !insight ? (
            /* Nothing picked: where the week's money came from, by department.
             Rolled up from the rows already on screen, so it costs no call
             and cannot disagree with the list beside it. */
            <Top200Landing
              ranked={ranked}
              netSales={netSales}
              oneDay={oneDay}
              start={start}
              end={end}
              lwStart={lwStart}
              lwEnd={lwEnd}
              lyStart={lyStart}
              lyEnd={lyEnd}
            />
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

              <ItemReport
                ranked={ranked}
                periodLabel={periodLabel}
                setInvoicesOpen={setInvoicesOpen}
              />
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
