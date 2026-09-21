import { useCallback, useRef } from "react";
import { useAppDispatch } from "../../../hooks";
import {
  startReceivingWalk,
  setReceivingProgress,
  setReceivingError,
} from "../../../features/dev/devItemReportSlice";
import {
  fetchInvoices,
  fetchReceiversByItem,
  toReceiptLineFromSearch,
  RECEIVING_LOOKBACK_DAYS,
  type ReportScope,
  type ReceiptLine,
} from "./itemReportData";

/**
 * The receiving half of Item Actions.
 *
 * `receivers/item_search` answers the whole question in one paged request:
 * given a list of UPCs, which receivers carry them. This used to open every
 * invoice in the lookback one at a time — six at once, several hundred deep,
 * flushing partial results as it went — because prod had no bulk form. That
 * endpoint has since shipped, so the walk and its concurrency, batching and
 * progress machinery are gone.
 *
 * `receivers/` is still called alongside it, for one number: `invoicesTotal`
 * is how the page tells "this store keeps no received orders" apart from
 * "none of these items arrived", and only the unfiltered count can say that.
 *
 * Results go to Redux, not to local state, because component state dies on a
 * route change and this is still the most expensive thing the page does.
 *
 * The hook keeps only a run token, to settle races between a search and the
 * one that replaced it.
 */

/** Hard ceiling on invoices opened. Reached only at very busy stores; when it
 *  is, the page reports the remainder rather than presenting a partial walk as
 *  a complete one. */
const MAX_INVOICES = 600;

export const useReceivingWalk = () => {
  const dispatch = useAppDispatch();
  /** The most recent walk. A response whose token no longer matches belongs to
   *  a search the user has already replaced, and is dropped rather than merged
   *  into the current report. */
  const runId = useRef(0);

  const start = useCallback(
    async (scope: ReportScope, upcs: string[]) => {
      const id = ++runId.current;
      dispatch(startReceivingWalk());

      // Every invoice still has to be opened — there is no way to know which one
      // carries a UPC without looking — but only the uploaded codes are kept.
      // The rest were retained to discover items the file never named, and the
      // report no longer asks that question.
      const wanted = new Set(upcs);

      const stale = () => runId.current !== id;

      try {
        /**
         * `receivers/` is still called, for one number.
         *
         * `invoicesTotal` is what the page reads to decide whether receiving
         * data exists at all — zero means "this store keeps no received
         * orders", which is a different statement from "none of these items
         * arrived". Putting the count of *matched* receivers there instead
         * would conflate the two and quietly suppress every honest "never
         * received" verdict the page exists to give.
         *
         * Both calls read the same table, so failing together is the normal
         * case; a partial answer here is worth less than a loud error.
         */
        const [invoices, found] = await Promise.all([
          fetchInvoices(scope, RECEIVING_LOOKBACK_DAYS),
          fetchReceiversByItem(
            scope,
            upcs,
            RECEIVING_LOOKBACK_DAYS,
            MAX_INVOICES,
          ),
        ]);
        if (stale()) return;

        const acc: Record<string, ReceiptLine[]> = {};
        for (const receiver of found.receivers) {
          for (const line of receiver.lines ?? []) {
            const receipt = toReceiptLineFromSearch(receiver, line);
            // The endpoint already matched these codes; this only catches the
            // display-form mismatch its second match branch allows for.
            if (!wanted.has(receipt.productCode)) continue;
            const existing = acc[receipt.productCode];
            if (existing) existing.push(receipt);
            else acc[receipt.productCode] = [receipt];
          }
        }
        // Receivers arrive newest-first, but a code can appear on pages that
        // resolved out of order, so each item is sorted once at the end —
        // same as the incremental walk.
        for (const receipts of Object.values(acc)) {
          receipts.sort((a, b) => b.date.localeCompare(a.date));
        }

        // Fresh arrays, for the reason `snapshot()` below spells out: immer
        // freezes whatever is dispatched, and handing over `acc`'s own arrays
        // would make any later push throw.
        const receipts: Record<string, ReceiptLine[]> = {};
        for (const code in acc) receipts[code] = [...acc[code]];

        dispatch(
          setReceivingProgress({
            receipts,
            seen: invoices.length,
            total: invoices.length,
            skipped: found.skipped,
            done: true,
          }),
        );
      } catch (e) {
        if (stale()) return;
        dispatch(
          setReceivingError(
            e instanceof Error ? e.message : "Could not load receivers",
          ),
        );
      }
    },
    [dispatch],
  );

  /** Invalidates any walk still in flight, so a replaced search can't have its
   *  results land on top of the new one. The slice clears the data itself. */
  const cancel = useCallback(() => {
    runId.current++;
  }, []);

  return { startWalk: start, cancelWalk: cancel };
};
