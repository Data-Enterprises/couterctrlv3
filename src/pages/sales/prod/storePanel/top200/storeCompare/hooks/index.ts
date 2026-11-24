// Hooks
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../../../../../hooks";
import { useSalesCtx } from "../../../../hooks";
import { useToast } from "../../../../../../../components/toasts/hooks/useToast";

// Redux
import { cacheTopItemsTy } from "../../../../../../../features/salesLedgerSlice";

// API
import {
  getItemDetail,
  getTopItems,
  TOP_ITEMS_FETCH,
  type ItemDetailResponse,
  type TopItemsResponse,
} from "../../../../../../../api/topItems";

// Utils
import { reasonOf } from "../../../../../../../utils/serverError";

// Interfaces
import type { Side } from "../../interfaces";
import type { ComparedTopItem } from "../utils/topItemsCompare";

/**
 * Both stores' week, from the cache where it has them.
 *
 * Read-only on the slice: `setTopItems` also moves the tab's CURRENT rows,
 * which belong to the open store, so writing the counterpart's week there
 * would leave the single-store tab holding the wrong store's list.
 */
export const useCompareSides = (
  openStoreId: number,
  compareStoreId: number,
  twStart: string,
  twEnd: string,
) => {
  const {
    url,
    token,
    topItemsCache: cache,
    topItemsTyCache: tyCache,
  } = useSalesCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [mine, setMine] = useState<Side | null>(null);
  const [theirs, setTheirs] = useState<Side | null>(null);
  const [loading, setLoading] = useState(true);

  const key = `${openStoreId}__${twStart}__${twEnd}`;
  const theirKey = `${compareStoreId}__${twStart}__${twEnd}`;

  useEffect(() => {
    let live = true;
    /** The full entry a single-store visit leaves, or this tab's own. */
    const held = (k: string): Side | null => {
      const full = cache[k];
      if (full) return { rows: full.rows, points: full.points };
      const ty = tyCache[k];
      return ty ? { rows: ty.rows, points: ty.points } : null;
    };

    const want = (k: string, storeid: number): Promise<Side> => {
      const hit = held(k);
      if (hit) return Promise.resolve(hit);
      return getTopItems(
        url,
        token,
        storeid,
        twStart,
        twEnd,
        TOP_ITEMS_FETCH,
      ).then((resp) => {
        const j: TopItemsResponse = resp.data;
        if (j.error !== 0) throw new Error(j.msg || "Could not read top items");
        const side = { rows: j.items ?? [], points: j.price_points ?? [] };
        // Kept, so leaving for Hourly and coming back is free. Written to
        // the TY store, never the shared one: a partial entry there would
        // leave the single-store tab with no vs LW or vs LY.
        dispatch(cacheTopItemsTy({ key: k, ...side }));
        return side;
      });
    };

    setLoading(true);
    Promise.all([want(key, openStoreId), want(theirKey, compareStoreId)])
      .then(([a, b]) => {
        if (!live) return;
        setMine(a);
        setTheirs(b);
      })
      .catch((e) => live && toast.error(reasonOf(e)))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
    // `cache` deliberately out of the deps: a hit is taken when the pair
    // changes, and a later eviction must not refetch a week already on
    // screen.
  }, [key, theirKey]);

  return { mine, theirs, loading };
};

/**
 * For a one-sided row, what the other store actually did with it.
 *
 * Only then: on a row both stores list, both figures are already in hand and
 * a call would answer a question nobody has. Fired on selection the way the
 * single-store tab fires its own, so there is nothing to press.
 */
export const useAbsentDetail = (
  selected: ComparedTopItem | null,
  openStoreId: number,
  compareStoreId: number,
  twStart: string,
  twEnd: string,
) => {
  const { url, token } = useSalesCtx();
  const toast = useToast();
  const [absent, setAbsent] = useState<ItemDetailResponse | null>(null);
  const [absentLoading, setAbsentLoading] = useState(false);

  useEffect(() => {
    if (!selected || selected.only === null) {
      setAbsent(null);
      return;
    }
    const askStore = selected.only === "mine" ? compareStoreId : openStoreId;
    let live = true;
    setAbsent(null);
    setAbsentLoading(true);
    getItemDetail(url, token, askStore, selected.code, twStart, twEnd, 0)
      .then((resp) => {
        const j: ItemDetailResponse = resp.data;
        if (!live || j.error !== 0) return;
        setAbsent(j);
      })
      // The other store refused (not assigned to you): say so rather than show nothing.
      .catch((e) => live && toast.warn(reasonOf(e)))
      .finally(() => live && setAbsentLoading(false));
    return () => {
      live = false;
    };
  }, [selected?.code, selected?.only]);

  return { absent, absentLoading };
};
