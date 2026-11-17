// Hooks
import { useEffect, useState } from "react";
import { useItemReportCtx } from "../../hooks";

// API
import { getTransactionList } from "../../../../../api/lossPrevention";

// Utils
import { fetchAllPages } from "../../../../../utils/paging";
import { serverDetail } from "../../../../../utils/serverError";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";

/**
 * The basket behind one sale, fetched when it is opened rather than held in
 * advance: keeping every line of 400 receipts so one might be viewed would be
 * a great deal of memory against a small chance of being read. Lines come back
 * in register order, so the basket reads like the receipt.
 */
export const useBasket = (openSale: TransactionListItem | null) => {
  const { url, token } = useItemReportCtx();
  const [basket, setBasket] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!openSale) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTransactionList(url, token, [openSale.sale_id], 1, "Sale")
      .then(async (resp) => {
        const body = resp.data;
        if (body.error !== 0) throw new Error(body.msg ?? "Could not load it");
        return fetchAllPages(
          body,
          (body.transactions ?? []) as TransactionListItem[],
          async (page) => {
            try {
              const r = await getTransactionList(
                url,
                token,
                [openSale.sale_id],
                page,
                "Sale",
              );
              return r.data.error === 0 ? r.data.transactions : [];
            } catch {
              return [];
            }
          },
        );
      })
      .then((all) => {
        if (cancelled) return;
        // Line order, so the modal reads like the receipt it represents.
        setBasket([...all].sort((a, b) => a.line_number - b.line_number));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          serverDetail(e) ??
            (e instanceof Error
              ? e.message
              : "Could not load that transaction"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openSale, url, token]);

  return { basket, loading, error };
};
