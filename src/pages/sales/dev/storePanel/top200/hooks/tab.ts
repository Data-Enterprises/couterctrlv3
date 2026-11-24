// Hooks
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";
import { useTop200View } from ".";

// Redux
import {
  EMPTY_TOP200_VIEW,
  restoreTopItems,
  setTop200View,
  setTopItems,
  setTopItemsLoading,
} from "../../../../../../features/dev/devSalesLedgerSlice";

// API
import {
  getItemDetail,
  getTopItems,
  COST_HISTORY_DAYS,
  TOP_ITEMS_FETCH,
  type ItemDetailResponse,
  type TopItemsResponse,
} from "../../../../../../api/topItems";

// Utils
import { dayText, inFlight } from "../utils";
import { reasonOf } from "../../../../../../utils/serverError";

interface Top200TabInput {
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
 * The Top 200 tab's reads: all three windows at once (cached per store and
 * week in the slice), the open item's detail, and the resets when the store,
 * week or item changes, Escape closes the invoices, or the tab closes.
 */
export const useTop200Tab = ({
  storeId,
  start,
  end,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Top200TabInput) => {
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

  return {
    oneDay,
    periodLabel,
    fold,
    haveRows,
    folded,
    invoicesOpen,
    setInvoicesOpen,
    topItems,
    topItemsLW,
    topItemsLY,
    topItemsLoading,
    detail,
  };
};
