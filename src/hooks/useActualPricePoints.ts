import { useCallback, useRef, useState } from "react";
import { useAppSelector } from ".";
import { getProductLookup, getTransactionList } from "../api/lossPrevention";
import { fetchAllPages } from "../utils/paging";
import type { ProductLookupResp, TransactionListItem } from "../interfaces";

/**
 * The register-level half of Item Analysis — spec §4.
 *
 * Two steps, because no endpoint goes from an item to its lines directly:
 * `product_lookup` names the receipts, `transaction_list` opens them.
 *
 * Step one takes the UPC every caller already holds, so it cannot over-match
 * and needs no paging — the ids arrive in full on one response. Step two is
 * paged and fans out pages 2..N together. Step three still filters strictly on
 * `product_code`, because `transaction_list` returns whole receipts and most of
 * what comes back belongs to other items.
 */

/** Receipts are opened by id, and the id list travels in the request body.
 *  A fast-moving item over a fortnight can run to thousands, so this caps the
 *  walk and the page says how many it dropped rather than quietly lying. */
const MAX_TRANSACTIONS = 400;

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

export interface ActualFetchState {
  lines: TransactionListItem[];
  /** Which UPC `lines` belongs to. Every consumer checks this before reading —
   *  without it, clicking a second item while the first is still in flight
   *  shows the first item's registers under the second item's name. */
  upc: string | null;
  loading: boolean;
  error: string | null;
  /** Receipts beyond the cap. Zero on every ordinary item. */
  truncated: number;
}

const initial: ActualFetchState = {
  lines: [],
  upc: null,
  loading: false,
  error: null,
  truncated: 0,
};

export const useActualPricePoints = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const [state, setState] = useState<ActualFetchState>(initial);
  /** The most recent request. A response whose token no longer matches is a
   *  loser of a race and is dropped rather than rendered. */
  const requestId = useRef(0);

  const run = useCallback(
    async (upc: string, storeid: number, start: string, end: string) => {
      const id = ++requestId.current;
      setState({ ...initial, upc, loading: true });

      const stale = () => requestId.current !== id;

      try {
        /**
         * Step one: name the receipts.
         *
         * This was `cashier_table` searched by product description, which is
         * the only search that endpoint offers. It returned just the baskets
         * carrying a discount row — SF BACON 12 OZ sold 81 units in a week and
         * only 40 of them, the discounted ones, ever reached the panel.
         * `product_lookup` is scoped on `qty <> 0` instead, so it answers with
         * every basket containing the item.
         */
        const lookupResp = await getProductLookup(
          url,
          token,
          start,
          end,
          USE_GROUPS,
          storeid,
          SINGLE_STORE,
          { productCodes: [upc] },
        );
        if (stale()) return;
        const lookup = lookupResp.data as ProductLookupResp;
        if (lookup.error !== 0) {
          setState({
            ...initial,
            upc,
            error: lookup.msg ?? "Could not load transactions",
          });
          return;
        }
        // Passing productCodes makes the product explicit, so the ids come
        // back on this same response — the picker and its second round trip
        // are only for a searchString that spans several products.
        let saleIds = [...new Set(lookup.transaction_ids ?? [])];

        let truncated = 0;
        if (saleIds.length > MAX_TRANSACTIONS) {
          truncated = saleIds.length - MAX_TRANSACTIONS;
          saleIds = saleIds.slice(0, MAX_TRANSACTIONS);
        }
        if (saleIds.length === 0) {
          // Empty, not null — the panel says "no register data" rather than
          // spinning forever.
          setState({ ...initial, upc });
          return;
        }

        const listResp = await getTransactionList(
          url,
          token,
          saleIds,
          1,
          "Sale",
        );
        if (stale()) return;
        const list = listResp.data;
        if (list.error !== 0) {
          setState({
            ...initial,
            upc,
            error: list.msg ?? "Could not load receipts",
          });
          return;
        }

        const all = await fetchAllPages(
          list,
          (list.transactions ?? []) as TransactionListItem[],
          async (page) => {
            try {
              const r = await getTransactionList(
                url,
                token,
                saleIds,
                page,
                "Sale",
              );
              return r.data.error === 0 ? r.data.transactions : [];
            } catch {
              return [];
            }
          },
        );
        if (stale()) return;

        // Step three. `transaction_list` returns whole receipts, so most of
        // what came back belongs to other items entirely.
        setState({
          lines: all.filter((t) => String(t.product_code) === upc),
          upc,
          loading: false,
          error: null,
          truncated,
        });
      } catch (e) {
        if (stale()) return;
        setState({
          ...initial,
          upc,
          error: e instanceof Error ? e.message : "Could not load transactions",
        });
      }
    },
    [url, token],
  );

  /** Dropped when the selection is cleared, so a stale panel can't outlive the
   *  item it describes. */
  const reset = useCallback(() => {
    requestId.current++;
    setState(initial);
  }, []);

  return { actual: state, loadActual: run, resetActual: reset };
};
