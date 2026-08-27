import { useCallback, useRef, useState } from "react";
import { useAppSelector } from "../../hooks";
import {
  getCashierTable,
  getProductLookup,
  getTransactionList,
} from "../../api/lossPrevention";
import { fetchAllPages } from "../../utils/paging";
import type { ProductLookupResp, TransactionListItem } from "../../interfaces";

/**
 * The register-level half of Item Analysis — spec §4.
 *
 * Two steps, because no endpoint goes from an item to its lines directly:
 * `cashier_table` names the receipts, `transaction_list` opens them. Both are
 * paged and both fan out pages 2..N together.
 *
 * Step one searches by **product description**, not UPC — that is the only
 * search the endpoint offers. It over-matches by design ("BAG ICE 7 LB" also
 * hits "BAG ICE 20 LB"), which is why step three filters strictly on
 * `product_code`. Widening the receipt net costs nothing; the filter is what
 * makes the answer exact.
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

interface Options {
  /**
   * Opt in to `cashiers/product_lookup` for step one instead of
   * `cashier_table`. Off by default: this hook also serves Inventory's Sub
   * Dept and Vendor panels, and only Item Actions is moving.
   *
   * TEMPORARY, dev only. `product_lookup` does not exist on prod yet, so the
   * flag is ANDed with `apiEnv === "dev"` below and prod keeps the old walk.
   * Delete the option and the branch once the endpoint ships.
   */
  productLookup?: boolean;
}

export const useActualPricePoints = (options: Options = {}) => {
  const { url, token, apiEnv } = useAppSelector((s) => s.app);
  const useLookup = options.productLookup === true && apiEnv === "dev";
  const [state, setState] = useState<ActualFetchState>(initial);
  /** The most recent request. A response whose token no longer matches is a
   *  loser of a race and is dropped rather than rendered. */
  const requestId = useRef(0);

  const run = useCallback(
    async (
      upc: string,
      description: string,
      storeid: number,
      start: string,
      end: string,
    ) => {
      const id = ++requestId.current;
      setState({ ...initial, upc, loading: true });

      const stale = () => requestId.current !== id;

      try {
        /**
         * Step one: name the receipts. Step two is the same either way.
         *
         * `product_lookup` takes the UPC this hook already holds, so it needs
         * no description search and cannot over-match. `cashier_table` can
         * only be searched by description, and it returned just the baskets
         * carrying a discount row — SF BACON 12 OZ sold 81 units in a week and
         * only 40 of them, the discounted ones, ever reached the panel.
         */
        let saleIds: string[];

        if (useLookup) {
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
          saleIds = [...new Set(lookup.transaction_ids ?? [])];
        } else {
          const firstResp = await getCashierTable(
            url,
            token,
            start,
            end,
            USE_GROUPS,
            storeid,
            SINGLE_STORE,
            ["description"],
            1,
            description,
          );
          if (stale()) return;
          const first = firstResp.data;
          if (first.error !== 0) {
            setState({
              ...initial,
              upc,
              error: first.msg ?? "Could not load transactions",
            });
            return;
          }

          const receipts = await fetchAllPages(
            first,
            (first.transactions ?? []) as { sale_id: string }[],
            async (page) => {
              try {
                const r = await getCashierTable(
                  url,
                  token,
                  start,
                  end,
                  USE_GROUPS,
                  storeid,
                  SINGLE_STORE,
                  ["description"],
                  page,
                  description,
                );
                return r.data.error === 0 ? r.data.transactions : [];
              } catch {
                return [];
              }
            },
          );
          if (stale()) return;

          saleIds = [...new Set(receipts.map((t) => t.sale_id))];
        }

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
    [url, token, useLookup],
  );

  /** Dropped when the selection is cleared, so a stale panel can't outlive the
   *  item it describes. */
  const reset = useCallback(() => {
    requestId.current++;
    setState(initial);
  }, []);

  return { actual: state, loadActual: run, resetActual: reset };
};
