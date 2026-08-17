import { useCallback, useRef } from "react";
import { useAppDispatch } from "../../hooks";
import {
  startReceivingWalk,
  setReceivingProgress,
  setReceivingError,
} from "../../features/itemReportSlice";
import {
  fetchInvoices,
  fetchInvoiceLines,
  toReceiptLine,
  RECEIVING_LOOKBACK_DAYS,
  type ReportScope,
  type ReceiptLine,
} from "./itemReportData";

/**
 * The receiving half of Item Actions, walked in the background.
 *
 * `receivers/details` opens one invoice at a time and there is no bulk form, so
 * finding out when a UPC last arrived means opening invoices until it turns up.
 * Nothing in the app had done this walk before — the Receivers page opens one
 * invoice on click — which is why every constraint here is explicit rather than
 * inherited.
 *
 * Every invoice in the lookback is opened, because an item can only be found by
 * opening the invoice it sits on. Only lines matching the uploaded UPCs are
 * kept, though — the report answers for the list it was given and nothing else,
 * so retaining the rest would be several hundred invoices' worth of lines held
 * in Redux that nothing reads.
 *
 * Results go to Redux, not to local state. The walk is the most expensive thing
 * the page does, and component state dies on a route change — so leaving it here
 * would mean paying for the whole walk again every time someone navigated away
 * and back.
 *
 * The hook keeps only refs: a run token to settle races, and the accumulator the
 * flush batches out of. Neither is state, and neither survives — nor needs to.
 */

/** How many invoices are opened at once. High enough to finish a quarter in a
 *  reasonable time, low enough not to monopolise the connection pool while the
 *  user is clicking around the report the walk is filling in. */
const CONCURRENCY = 6;

/** Hard ceiling on invoices opened. Reached only at very busy stores; when it
 *  is, the page reports the remainder rather than presenting a partial walk as
 *  a complete one. */
const MAX_INVOICES = 600;

/** Invoices between dispatches. One per invoice would re-render a sheet of
 *  several hundred rows several hundred times. */
const FLUSH_EVERY = 8;

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

      let invoices;
      try {
        invoices = await fetchInvoices(scope, RECEIVING_LOOKBACK_DAYS);
      } catch (e) {
        if (stale()) return;
        dispatch(
          setReceivingError(
            e instanceof Error ? e.message : "Could not load receivers",
          ),
        );
        return;
      }
      if (stale()) return;

      const skipped = Math.max(0, invoices.length - MAX_INVOICES);
      const walk = invoices.slice(0, MAX_INVOICES);
      if (walk.length === 0) {
        dispatch(
          setReceivingProgress({
            receipts: {},
            seen: 0,
            total: 0,
            skipped,
            done: true,
          }),
        );
        return;
      }

      // Accumulated locally and dispatched periodically.
      const acc: Record<string, ReceiptLine[]> = {};
      let seen = 0;

      /**
       * A copy deep enough to hand to Redux, which is one level deeper than it
       * looks like it needs to be.
       *
       * The dispatched object *becomes* state, and immer deep-freezes state in
       * development. A shallow `{ ...acc }` would put these very arrays into the
       * store, freeze them there, and make the next `push` on the accumulator
       * throw — killing the worker mid-walk. So each flush gets fresh arrays;
       * only the line objects are shared, and those are never mutated.
       *
       * A new outer object every time is also what makes the sheet repaint.
       */
      const snapshot = () => {
        const out: Record<string, ReceiptLine[]> = {};
        for (const code in acc) out[code] = [...acc[code]];
        return out;
      };

      const flush = (done: boolean) => {
        dispatch(
          setReceivingProgress({
            receipts: snapshot(),
            seen,
            total: walk.length,
            skipped,
            done,
          }),
        );
      };

      let cursor = 0;
      const worker = async () => {
        for (;;) {
          if (stale()) return;
          const index = cursor++;
          if (index >= walk.length) return;
          const invoice = walk[index];
          const lines = await fetchInvoiceLines(scope, invoice);
          if (stale()) return;

          for (const line of lines) {
            const receipt = toReceiptLine(invoice, line);
            if (!wanted.has(receipt.productCode)) continue;
            const found = acc[receipt.productCode];
            if (found) found.push(receipt);
            else acc[receipt.productCode] = [receipt];
          }

          seen++;
          if (seen % FLUSH_EVERY === 0) flush(false);
        }
      };

      // The walk is fired as `void startWalk(...)`, so a throw in here would
      // otherwise surface as an unhandled rejection and nothing else: the
      // progress line would simply stop climbing and the report would present a
      // partial walk as a finished one. Report it instead — a wrong "never
      // received" is exactly the conclusion this page must not hand over.
      try {
        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, walk.length) }, worker),
        );
      } catch (e) {
        if (stale()) return;
        dispatch(
          setReceivingError(
            e instanceof Error
              ? `Receiving stopped after ${seen} of ${walk.length} invoices: ${e.message}`
              : "Receiving walk failed",
          ),
        );
        return;
      }
      if (stale()) return;

      // Invoices are opened out of order by the workers, so each item's
      // receipts are sorted once at the end rather than kept ordered during
      // the walk.
      for (const receipts of Object.values(acc)) {
        receipts.sort((a, b) => b.date.localeCompare(a.date));
      }
      flush(true);
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
