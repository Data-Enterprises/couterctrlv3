// Hooks
import { shallowEqual } from "react-redux";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  startReceivingWalk,
  setReceivingProgress,
  setReceivingError,
  setItemReportSelected,
  setItemReportActual,
  setItemReportInvoiceLines,
  setItemReportInvoiceError,
  setPendingUpload,
  setPendingUpcText,
  addPendingUpcs,
} from "../../../../features/dev/devItemReportSlice";

// Utils
import {
  fetchReceiversByItem,
  toReceiptLineFromSearch,
} from "../../../../utils/receivers";
import { normalizeProductCode } from "../../../../utils/productCode";
import {
  dayCount,
  fetchInvoiceById,
  fetchInvoices,
  MAX_INVOICES,
  RECEIVING_LOOKBACK_DAYS,
} from "../utils";
import { buildPriceEras } from "../utils/priceEras";
import { buildReport, buildRollup } from "../utils/report";
import { verdictFor } from "../utils/verdict";
import { parseUpload } from "../utils/parseUpload";

// Interfaces
import type {
  LoadForItem,
  ReportScope,
  ReceiptLine,
  SheetRow,
} from "../interfaces";
import type { SubsPricePoint } from "../../../../interfaces";
import type { ActualFetchState } from "../../../../hooks/useActualPricePoints";

/** The page's slice, the API connection, the picked date and the user's
 *  stores, read where they are used instead of passed down. */
export const useItemReportCtx = () => {
  const report = useAppSelector((s) => s.dev.itemReport, shallowEqual);
  const { url, token } = useAppSelector((s) => s.app);
  const { singleDate } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);
  return { ...report, url, token, singleDate, assignedStores };
};

export type ItemReportCtx = ReturnType<typeof useItemReportCtx>;

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

/**
 * The full order behind one delivery, fetched on demand.
 *
 * The walk discards every line that isn't on the report's list, so this is a
 * refetch rather than something already in hand — one call, and cached by
 * invoice id because people compare two deliveries back and forth.
 */
export const useInvoiceLines = (state: ItemReportCtx) => {
  const dispatch = useAppDispatch();
  const { url, token, openInvoice } = state;
  useEffect(() => {
    if (!openInvoice || !state.scope) return;
    const key = String(openInvoice.invoiceId);
    if (state.invoiceLines[key]) return;
    let cancelled = false;
    fetchInvoiceById(
      {
        url,
        token,
        storeid: state.scope.storeid,
        start: state.scope.start,
        end: state.scope.end,
      },
      openInvoice.invoiceId,
      openInvoice.date,
    )
      .then((lines) => {
        if (cancelled) return;
        dispatch(
          setItemReportInvoiceLines({
            invoiceId: openInvoice.invoiceId,
            lines,
          }),
        );
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        dispatch(
          setItemReportInvoiceError(
            e instanceof Error ? e.message : "Could not load that invoice",
          ),
        );
      });
    return () => {
      cancelled = true;
    };
    // Keyed on the open invoice alone — the scope can't change while a modal
    // over the report is open.
  }, [openInvoice]);
};

/**
 * The report's rows: each uploaded item with its verdict, the action counts,
 * the items with no receiver, and the selected row.
 */
export const useItemReportSheet = (state: ItemReportCtx) => {
  const windowDays = state.scope
    ? dayCount(state.scope.start, state.scope.end)
    : 30;

  /** Points keyed by product code, normalised the same way the rows are —
   *  `subs/subs` sends codes as numbers on some rows and with a trailing `.0`
   *  on others, so an unnormalised key silently matches nothing. */
  const pointsByUpc = useMemo(() => {
    const map: Record<string, SubsPricePoint[]> = {};
    for (const pp of state.pricePoints) {
      const code = normalizeProductCode(pp.product_code);
      (map[code] ??= []).push(pp);
    }
    return map;
  }, [state.pricePoints]);

  const items = useMemo(
    () =>
      state.scope
        ? buildReport(
            state.upcs,
            state.tyRows,
            state.lwRows,
            state.lyRows,
            state.receipts,
            pointsByUpc,
            state.scope.start,
            state.scope.end,
          )
        : [],
    [
      pointsByUpc,
      state.scope,
      state.upcs,
      state.tyRows,
      state.lwRows,
      state.lyRows,
      state.receipts,
    ],
  );

  /**
   * The two populations, and the counts the toggle shows.
   *
   * Both are derived from one `buildReport` pass, so flipping scope costs a
   * filter rather than a rebuild — and the counts stay honest while the walk is
   * still running, since "all found" climbs as receipts land.
   */
  const scopedItems = items;

  /**
   * Whether this store has any receiving at all in the lookback.
   *
   * A finished walk that opened zero invoices is `receivers/` answering
   * `record_count: 0` — the store keeps no received orders in the data, which
   * is a different thing from an item never appearing on one. Only meaningful
   * once the walk is done; while it runs the rows are "pending" anyway.
   */
  const receivingAvailable = !(
    state.receivingComplete && state.invoicesTotal === 0
  );

  /**
   * How many items have no invoice behind them — the number that replaced an
   * action.
   *
   * "Check receiving" used to be a verdict, and on a store whose orders arrive
   * electronically it swallowed every row: 522 items in one bucket, reading
   * `Reprice 0` because the chain returned before the pricing tests ran. The
   * absence is one fact about the data, so it is counted once and said once,
   * and the rows carry whatever their sales actually show.
   */
  const noReceiverItems = useMemo(
    () =>
      items.filter((i) => (state.receipts[i.productCode] ?? []).length === 0),
    [items, state.receipts],
  );

  const sheetRows: SheetRow[] = useMemo(
    () =>
      scopedItems.map((item) => {
        const receipts = state.receipts[item.productCode] ?? [];
        return {
          item,
          verdict: verdictFor(
            item,
            receipts,
            buildPriceEras(item, receipts),
            windowDays,
            state.scope?.end ?? "",
            RECEIVING_LOOKBACK_DAYS,
            state.receivingComplete,
          ),
        };
      }),
    [
      scopedItems,
      state.receipts,
      state.receivingComplete,
      state.scope?.end,
      windowDays,
    ],
  );

  const counts = useMemo(
    () => buildRollup(sheetRows.map((r) => r.verdict)),
    [sheetRows],
  );

  const selected = sheetRows.find(
    (r) => r.item.productCode === state.selectedUpc,
  );

  return {
    items,
    receivingAvailable,
    noReceiverItems,
    sheetRows,
    counts,
    selected,
  };
};

/**
 * The selected row's registers: the price table loads on selection, the
 * receipts only once a price is opened, and fetched receipts are kept in the
 * slice so a return to the page shows them.
 */
export const useItemRegisters = (
  state: ItemReportCtx,
  actual: ActualFetchState,
  loadActual: LoadForItem,
  resetActual: () => void,
  loadPrices: LoadForItem,
) => {
  const dispatch = useAppDispatch();

  /**
   * Registers load on selection. Two calls for one item, never across the
   * sheet — and no verdict depends on them, so a reader who clicks nothing
   * loses nothing.
   */
  const selectRow = (row: SheetRow) => {
    if (!state.scope) return;
    const code = row.item.productCode;
    dispatch(setItemReportSelected(code));
    // Already fetched this search? Two calls saved, and the panel paints from
    // the cache immediately instead of spinning.
    const { storeid, start, end } = state.scope;
    loadPrices(code, storeid, start, end);
    // Receipts are the expensive half and most rows never open one. Cached
    // from an earlier look, they are already here; otherwise they wait.
    if (state.actualByUpc[code]) {
      resetActual();
      return;
    }
  };

  /**
   * Fetched lines go to Redux the moment they land.
   *
   * The hook is shared with Inventory's two panels, so its internals stay as
   * they are — Item Actions keeps its own copy in its own slice rather than
   * moving component state that three pages depend on.
   */
  useEffect(() => {
    if (actual.loading || actual.error || !actual.upc) return;
    if (state.actualByUpc[actual.upc]) return;
    dispatch(
      setItemReportActual({
        upc: actual.upc,
        lines: actual.lines,
        truncated: actual.truncated,
      }),
    );
  }, [actual, state.actualByUpc, dispatch]);

  /**
   * What the rail reads: the live fetch while one is in flight, the cache
   * otherwise. Without this a return to the page shows an empty panel beside a
   * still-selected row.
   */
  const selectedActual: ActualFetchState = useMemo(() => {
    const code = state.selectedUpc;
    if (!code) return actual;
    if (actual.upc === code && (actual.loading || actual.error)) return actual;
    const cached = state.actualByUpc[code];
    if (cached)
      return {
        lines: cached.lines,
        upc: code,
        loading: false,
        error: null,
        truncated: cached.truncated,
      };
    return actual;
  }, [actual, state.actualByUpc, state.selectedUpc]);

  /** Opening a price reads its receipts, unless they are already cached. */
  const openPrice = () => {
    const code = state.selectedUpc;
    if (!state.scope || !code || state.actualByUpc[code]) return;
    loadActual(code, state.scope.storeid, state.scope.start, state.scope.end);
  };

  return { selectRow, selectedActual, openPrice };
};

/**
 * The entry card's UPC list: a pasted box adds to the pending list (and says
 * what it skipped), and a CSV replaces it with its codes and department
 * column.
 */
export const useUpcEntry = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { pendingUpcText: upcText } = useItemReportCtx();

  const handleParseText = () => {
    const parsed = parseUpload(upcText);

    // Both of these used to return in silence, which read as the button doing
    // nothing at all. Commas are the separator the box advertises, so a paste
    // that came in spaces or semicolons is the likely cause of either.
    if (parsed.upcs.length === 0) {
      toast.warn("No UPCs found — separate codes with commas");
      return;
    }
    if (parsed.skippedLines > 0) {
      const n = parsed.skippedLines;
      toast.warn(
        `Added ${parsed.upcs.length}, skipped ${n} line${n === 1 ? "" : "s"} — separate codes with commas`,
      );
    }
    if (parsed.tooShort.length > 0) {
      const shown = parsed.tooShort.slice(0, 5).join(", ");
      const more =
        parsed.tooShort.length > 5
          ? ` and ${parsed.tooShort.length - 5} more`
          : "";
      toast.warn(
        `Added ${parsed.upcs.length}; left out ${shown}${more} — too short to be a UPC`,
      );
    }

    dispatch(addPendingUpcs(parsed.upcs));
    dispatch(setPendingUpcText(""));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseUpload(String(ev.target?.result ?? ""));
      // A file that yields nothing is worth saying out loud — silence here
      // looks like the upload itself failed. Skipped lines aren't reported for
      // a file: an exported report is mostly headers and totals rows, so a
      // count of them would be noise rather than a problem.
      if (parsed.upcs.length === 0) {
        toast.warn(`No UPCs found in ${file.name}`);
        return;
      }
      // A CSV replaces rather than merges: it carries the department column that
      // narrows the fan-out, and merging two files' departments would widen the
      // read back out without saying so.
      dispatch(
        setPendingUpload({
          upcs: parsed.upcs,
          departments: parsed.departments,
          fileName: file.name,
        }),
      );
    };
    reader.readAsText(file);
    // Cleared so re-picking the same file still fires.
    e.target.value = "";
  };

  return { handleParseText, handleCsvUpload };
};
