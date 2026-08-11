import { useCallback, useRef, useState } from "react";
import {
  fetchInvoices,
  fetchInvoiceLines,
  toReceiptLine,
  RECEIVING_LOOKBACK_DAYS,
  type ReportScope,
  type ReceiptLine,
} from "./itemReportData";

/**
 * The receiving half of Item Report, walked in the background.
 *
 * `receivers/details` opens one invoice at a time and there is no bulk form, so
 * finding out when a UPC last arrived means opening invoices until it turns up.
 * Nothing in the app had done this walk before — the Receivers page opens one
 * invoice on click — which is why every constraint here is explicit rather than
 * inherited.
 *
 * Every invoice in the lookback is opened, and no line is filtered out. That is
 * a deliberate cost: receipts are an entry point, not a lookup. An item that
 * was delivered and never scanned produces no sales row anywhere, so it cannot
 * reach the report through the upload — the only way to find it is to read what
 * came through the door and see what never rang. Filtering to a known UPC set
 * would make exactly those items invisible, which is the failure this walk
 * exists to catch.
 *
 * It runs behind the report rather than in front of it — sales render first and
 * receiving fills in underneath, because blocking a normal search on the
 * slowest half would make the page feel broken. Verdicts that depend on
 * receipts stay marked provisional until it finishes.
 */

/** How many invoices are opened at once. High enough to finish a quarter in a
 *  reasonable time, low enough not to monopolise the connection pool while the
 *  user is clicking around the report the walk is filling in. */
const CONCURRENCY = 6;

/** Hard ceiling on invoices opened. Reached only at very busy stores; when it
 *  is, the page reports the remainder rather than presenting a partial walk as
 *  a complete one. */
const MAX_INVOICES = 600;

/** Invoices between state flushes. Setting state per invoice would re-render
 *  the whole report several hundred times; batching keeps the progress readable
 *  without thrashing a list that may hold hundreds of rows. */
const FLUSH_EVERY = 8;

export interface ReceivingState {
  /** Receipts per UPC, newest first. Only holds the UPCs asked for. */
  receiptsByUpc: Map<string, ReceiptLine[]>;
  invoicesSeen: number;
  invoicesTotal: number;
  running: boolean;
  /** True once the walk has finished — either every invoice was opened or every
   *  item was found. Until then, an item with no receipts hasn't been proven to
   *  have none. */
  complete: boolean;
  /** Invoices beyond the cap, left unopened. */
  skipped: number;
  /** How far back deliveries were read, for labelling. "No delivery in 90 days"
   *  is a claim the page can defend; "never received" is not. */
  lookbackDays: number;
  error: string | null;
}

const initial: ReceivingState = {
  receiptsByUpc: new Map(),
  invoicesSeen: 0,
  invoicesTotal: 0,
  running: false,
  complete: false,
  skipped: 0,
  lookbackDays: RECEIVING_LOOKBACK_DAYS,
  error: null,
};

export const useReceivingWalk = () => {
  const [state, setState] = useState<ReceivingState>(initial);
  /** The most recent walk. A response whose token no longer matches belongs to
   *  a search the user has already replaced, and is dropped rather than merged
   *  into the current report. */
  const runId = useRef(0);

  const start = useCallback(async (scope: ReportScope) => {
    const id = ++runId.current;
    setState({ ...initial, receiptsByUpc: new Map(), running: true });

    const stale = () => runId.current !== id;

    let invoices;
    try {
      invoices = await fetchInvoices(scope, RECEIVING_LOOKBACK_DAYS);
    } catch (e) {
      if (stale()) return;
      setState({
        ...initial,
        running: false,
        error: e instanceof Error ? e.message : "Could not load receivers",
      });
      return;
    }
    if (stale()) return;

    const skipped = Math.max(0, invoices.length - MAX_INVOICES);
    const walk = invoices.slice(0, MAX_INVOICES);
    if (walk.length === 0) {
      setState({
        ...initial,
        running: false,
        complete: true,
        invoicesTotal: 0,
        skipped,
      });
      return;
    }

    // Accumulated in a ref-like local and flushed periodically. The map is
    // rebuilt on each flush rather than mutated in place, so React sees a new
    // reference and the report actually repaints.
    const acc = new Map<string, ReceiptLine[]>();
    let seen = 0;

    const flush = (done: boolean) => {
      setState({
        receiptsByUpc: new Map(acc),
        invoicesSeen: seen,
        invoicesTotal: walk.length,
        running: !done,
        complete: done,
        skipped,
        lookbackDays: RECEIVING_LOOKBACK_DAYS,
        error: null,
      });
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

        // Every line is kept. Narrowing to the uploaded UPCs here is what would
        // hide the delivered-but-never-scanned items; the report decides which
        // codes are in scope once it can cross them against sales.
        for (const line of lines) {
          const receipt = toReceiptLine(invoice, line);
          const found = acc.get(receipt.productCode);
          if (found) found.push(receipt);
          else acc.set(receipt.productCode, [receipt]);
        }

        seen++;
        if (seen % FLUSH_EVERY === 0) flush(false);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, walk.length) }, worker),
    );
    if (stale()) return;

    // Invoices are opened out of order by the workers, so each item's receipts
    // are sorted once at the end rather than kept ordered during the walk.
    for (const receipts of acc.values()) {
      receipts.sort((a, b) => b.date.localeCompare(a.date));
    }
    flush(true);
  }, []);

  /** Dropped when the search is replaced, so a walk can't outlive the report it
   *  was filling in. */
  const reset = useCallback(() => {
    runId.current++;
    setState({ ...initial, receiptsByUpc: new Map() });
  }, []);

  return { receiving: state, startWalk: start, resetWalk: reset };
};
