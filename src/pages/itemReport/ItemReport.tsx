import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector, useStoreName } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatDateSimple } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { useActualPricePoints } from "../inventory/useActualPricePoints";
import type { ActualFetchState } from "../inventory/useActualPricePoints";
import {
  setItemReportStoreId,
  setItemReportLoading,
  startItemReportSearch,
  setItemReportResults,
  setItemReportActual,
  setItemReportSelected,
  setItemReportSearchOpen,
  setItemReportExportOpen,
  clearItemReportHandoff,
  setItemReportSource,
  openItemReportInvoice,
  setItemReportInvoiceLines,
  setItemReportInvoiceError,
} from "../../features/itemReportSlice";
import ItemReportEntry from "./ItemReportEntry";
import InvoiceSheet from "./InvoiceSheet";
import type { SubDeptMargin, SubsPricePoint } from "../../interfaces";
import type { ItemReportHandoff } from "../../features/itemReportSlice";
import { collectCriticalItems } from "../sales/components/itemGrading";
import { scopeToStoreNumber } from "../sales/shared/ledgerUtils";
import ItemReportSheet, { type SheetRow } from "./ItemReportSheet";
import ItemReportRail from "./ItemReportRail";
import ItemReportExportModal from "./ItemReportExportModal";
import { useReceivingWalk } from "./useReceivingWalk";
import {
  fetchAllItemRows,
  fetchItemRowsWithPricePoints,
  inRange,
  lwWindow,
  lyWindow,
  weekEnding,
  fetchInvoiceById,
  RECEIVING_LOOKBACK_DAYS as RECEIVING_LOOKBACK,
  type ReportScope,
} from "./itemReportData";
import { normalizeProductCode } from "../../utils/productCode";
import {
  buildPriceEras,
  buildReport,
  buildRollup,
  verdictFor,
} from "./itemReportMetrics";

/**
 * Item Actions — a critical list, diagnosed and handed over.
 *
 * This is a delivery mechanism, not a workspace. The judgement work happened on
 * the performance pages upstream; by the time someone arrives here the answer
 * should already be on the page, and clicking should only ever be a shortcut.
 *
 * Three windows of sales are fetched — this one, last week, last year — because
 * neither baseline is sufficient alone. Last year catches a seasonal collapse
 * last week would call normal; last week catches a recovery last year would
 * still condemn, and flagging an item that is already coming back is the false
 * warning this page most needs to avoid.
 *
 * Receipts run behind the sheet and describe the uploaded items — when each
 * last arrived, at what cost, and whether enough of it came in to explain what
 * sold. The report answers for the list it was given and nothing else.
 *
 * Every piece of that lives in `itemReportSlice`, not in this component. A route
 * change unmounts the page, and rebuilding it costs a department fan-out over
 * three windows plus an invoice walk — so nothing here may be the kind of state
 * that dies when someone clicks away and comes back.
 */

const dayCount = (start: string, end: string) =>
  Math.max(
    1,
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() -
        new Date(`${start}T12:00:00`).getTime()) /
        86400000,
    ) + 1,
  );

const ItemReport = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  /**
   * Off until something reads them.
   *
   * `include_price_points` re-runs the whole inner query and aggregates it a
   * second time — `count(distinct (sale_date, terminal, sale_id))` and an
   * ordered `array_agg` per price — and the span it runs over is fourteen days
   * across every department. Meat alone produced 550 points for seven days.
   *
   * The points are fetched into Redux and nothing consumes them yet: they were
   * wired ahead of the pricing-grade work. Paying for them on the blocking path
   * meanwhile roughly doubled the report's load time, so the flag comes off
   * until there is a reader for it. The fetch, the paging and the slice field
   * all stay — flip this back to enable it.
   */
  const PRICE_POINTS_READY = false;
  const useSubsPricePoints = PRICE_POINTS_READY;
  const { singleDate } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);
  const state = useAppSelector((s) => s.itemReport);

  const { startWalk, cancelWalk } = useReceivingWalk();
  // Item Actions always knows the UPC, so step one can look the product up
  // directly instead of searching `cashier_table` by description. Price Opt
  // Sub Dept and Price Opt Vendor share this hook and do not opt in, so they
  // stay on the old walk until they are moved deliberately.
  const { actual, loadActual, resetActual } = useActualPricePoints({
    productLookup: true,
  });
  const storeName = useStoreName(state.scope?.storeid ?? state.storeId);

  const run = async (
    upcs: string[],
    uploadDepartments: string[],
    /** Where the list came from. Absent for an upload, which is the point —
     *  every run sets it, so a manual search can't inherit the provenance of a
     *  handoff that ran before it. */
    source?: { sourceLabel: string; basisLabel: string },
    /** A handed-over week and its rows. When present the department fan-out is
     *  skipped entirely — the caller already made those calls to grade the
     *  items it is passing over. */
    preloaded?: {
      window: { start: string; end: string };
      rows?: { ty: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
      /** Grading the caller deferred — resolved here, after the fetch. */
      grade?: ItemReportHandoff["grade"];
    },
  ) => {
    if (!state.storeId) {
      toast.warn("Please select a store");
      return;
    }
    if (upcs.length === 0 && !preloaded?.grade) {
      toast.warn("Add or upload at least one UPC");
      return;
    }
    // One date in, a fixed seven-day week out — the same contract the graded
    // pages work to, and what keeps the three periods comparable. A handoff
    // brings its own window, because its rows were fetched against that one and
    // the picker may have moved since.
    const week = preloaded?.window ?? weekEnding(singleDate);
    const next: ReportScope = {
      url,
      token,
      storeid: state.storeId,
      start: week.start,
      end: week.end,
    };
    dispatch(setItemReportSearchOpen(false));
    dispatch(setItemReportLoading({ loading: true }));
    dispatch(startItemReportSearch());
    dispatch(
      setItemReportSource(source ?? { sourceLabel: "", basisLabel: "" }),
    );
    resetActual();
    cancelWalk();

    try {
      // Rows in hand: nothing to fetch, so the report is on screen immediately
      // and only the invoice walk is left running behind it.
      if (preloaded?.rows) {
        dispatch(
          setItemReportResults({
            scope: { storeid: next.storeid, start: next.start, end: next.end },
            upcs,
            uploadDepartments,
            tyRows: preloaded.rows.ty,
            lwRows: preloaded.rows.lw,
            lyRows: preloaded.rows.ly,
          }),
        );
        // The handed-over list, and only that — same rule as the fetched path.
        const retained = new Set(upcs);
        void startWalk(next, [...retained]);
        return;
      }

      dispatch(
        setItemReportLoading({ loading: true, message: "Reading sales…" }),
      );

      /**
       * Two reads for three windows.
       *
       * `subs/subs` answers for every department at once, so nothing has to
       * discover which departments exist first — which is what the two
       * ninety-day `sub_sales` calls were for, and why they reached back a
       * quarter to answer a question about one week.
       *
       * This week and last week are consecutive seven-day windows, so one
       * range covers both and splits by date. Last year sits a year away and
       * needs its own. Rows in the overlap belong to both sets: the two
       * `inRange` filters are independent, not a partition.
       */
      const lwWin = lwWindow(next);
      const spanWindow = { start: lwWin.start, end: next.end };
      /**
       * TEMPORARY, dev only. `include_price_points` gives the prices each item
       * actually rang at instead of the blended daily average the rows carry;
       * prod's `subs/subs` has no such payload, so it keeps the shared fetch
       * and the page grades without them. Delete the fork once it ships.
       *
       * Points come off the span call, so they cover TW+LW — fourteen days of
       * pricing history rather than seven, for free.
       */
      const [spanResult, ly] = await Promise.all([
        useSubsPricePoints
          ? fetchItemRowsWithPricePoints(next, spanWindow)
          : fetchAllItemRows(next, spanWindow).then((rows) => ({
              rows,
              pricePoints: [] as SubsPricePoint[],
            })),
        fetchAllItemRows(next, lyWindow(next)),
      ]);
      const span = spanResult.rows;

      const ty = inRange(span, next.start, next.end);
      const lw = inRange(span, lwWin.start, lwWin.end);

      if (span.length === 0 && ly.length === 0) {
        toast.warn("No sales came back for that store and week");
        return;
      }

      /**
       * Deferred grading, resolved now that the rows are here.
       *
       * The rule is still the caller's — this page invents no severity of its
       * own. All that moved is *when* it gets applied, so the wait happens on
       * this page's loading screen rather than on the one the user just left.
       */
      let tyRows = ty;
      let lwRows = lw;
      let lyRows = ly;
      let listUpcs = upcs;
      let listDepts = uploadDepartments;

      if (preloaded?.grade) {
        const num = preloaded.grade.storeNumber;
        tyRows = scopeToStoreNumber(ty, num);
        lwRows = scopeToStoreNumber(lw, num);
        lyRows = scopeToStoreNumber(ly, num);

        const graded = collectCriticalItems(
          tyRows,
          lwRows,
          lyRows,
          preloaded.grade.threshold,
          preloaded.grade.metric,
        );
        if (graded.length === 0) {
          toast.info("No critical items in that store for that week");
          return;
        }
        listUpcs = [
          ...new Set(graded.map((g) => normalizeProductCode(g.productCode))),
        ];
        listDepts = [
          ...new Set(graded.map((g) => g.dept).filter((d) => d.length > 0)),
        ];
      }

      dispatch(
        setItemReportResults({
          scope: { storeid: next.storeid, start: next.start, end: next.end },
          upcs: listUpcs,
          uploadDepartments: listDepts,
          tyRows,
          lwRows,
          lyRows,
          pricePoints: spanResult.pricePoints,
        }),
      );

      // The uploaded list, and only that. It used to be widened with every
      // product that sold in any of the three windows, so the sheet could
      // discover items the file never named — but those codes travel to
      // `receivers/item_search` as the request body, and on a full store that
      // was 10,831 of them against a 2,000 ceiling. The report answers for the
      // list it was given.
      const retain = new Set(listUpcs);

      // Deliberately not awaited — the sheet is readable before the walk lands,
      // and receipts fill in behind it.
      void startWalk(next, [...retain]);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not build the action list",
      );
    } finally {
      dispatch(setItemReportLoading({ loading: false }));
    }
  };

  /**
   * A list handed over from Sub Dept Margins or Vendors.
   *
   * The handoff is cleared *before* the run starts, not after: `run` dispatches
   * on the way through, and a re-render that still saw the handoff would fire a
   * second identical fan-out on top of the first.
   */
  const handoff = state.handoff;
  useEffect(() => {
    if (!handoff) return;
    dispatch(clearItemReportHandoff());
    void run(
      handoff.upcs,
      handoff.departments,
      { sourceLabel: handoff.sourceLabel, basisLabel: handoff.basisLabel },
      { window: handoff.window, rows: handoff.rows, grade: handoff.grade },
    );
    // Keyed on the handoff object alone: `run` is redefined every render, and
    // depending on it would re-fire the fan-out on each one.
  }, [handoff]);

  /**
   * The full order behind one delivery, fetched on demand.
   *
   * The walk discards every line that isn't on the report's list, so this is a
   * refetch rather than something already in hand — one call, and cached by
   * invoice id because people compare two deliveries back and forth.
   */
  const openInvoice = state.openInvoice;
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

  const windowDays = state.scope
    ? dayCount(state.scope.start, state.scope.end)
    : 30;

  const items = useMemo(
    () =>
      state.scope
        ? buildReport(
            state.upcs,
            state.tyRows,
            state.lwRows,
            state.lyRows,
            state.receipts,
            state.scope.start,
            state.scope.end,
          )
        : [],
    [
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
  const noReceiverCount = noReceiverItems.length;

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
            RECEIVING_LOOKBACK,
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
    if (state.actualByUpc[code]) {
      resetActual();
      return;
    }
    loadActual(
      code,
      row.item.description,
      state.scope.storeid,
      state.scope.start,
      state.scope.end,
    );
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

  const entry = (
    <ItemReportEntry
      stores={assignedStores}
      storeId={state.storeId}
      onStoreSelect={(id) => dispatch(setItemReportStoreId(id))}
      onRun={run}
      loading={state.loading}
      loadingMessage={state.loadingMessage || "Building actions..."}
    />
  );

  if (state.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={state.loadingMessage || "Building actions..."}
        />
      </div>
    );
  }

  if (!state.scope || items.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry}
      </div>
    );
  }

  const dateLabel = `${formatDateSimple(state.scope.start)} – ${formatDateSimple(state.scope.end)}`;
  // The strip names the days each figure covers, the way the Sales strip does —
  // "vs last year" means nothing without saying which week that was.
  const range = (w: { start: string; end: string }) =>
    `${formatDateSimple(w.start)} – ${formatDateSimple(w.end)}`;
  const windowScope = {
    url,
    token,
    storeid: state.scope.storeid,
    start: state.scope.start,
    end: state.scope.end,
  };
  const periods = {
    tw: dateLabel,
    lw: range(lwWindow(windowScope)),
    ly: range(lyWindow(windowScope)),
  };

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing a
          load this expensive to change one field is what that pattern
          prevents. */}
      {state.searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => dispatch(setItemReportSearchOpen(false))}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      {openInvoice && (
        <InvoiceSheet
          vendorName={openInvoice.vendorName}
          invoiceId={openInvoice.invoiceId}
          date={openInvoice.date}
          fromUpc={openInvoice.fromUpc}
          fromAction={
            sheetRows.find((r) => r.item.productCode === openInvoice.fromUpc)
              ?.verdict.action
          }
          lines={state.invoiceLines[String(openInvoice.invoiceId)] ?? []}
          loading={state.invoiceLoading}
          error={state.invoiceError}
          onClose={() => dispatch(openItemReportInvoice(null))}
        />
      )}

      {state.exportOpen && (
        <ItemReportExportModal
          onClose={() => dispatch(setItemReportExportOpen(false))}
          storeName={storeName}
          dateLabel={dateLabel}
          lookbackDays={RECEIVING_LOOKBACK}
          rows={sheetRows}
          receiptsByUpc={state.receipts}
          receivingComplete={state.receivingComplete}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <ItemReportSheet
          rows={sheetRows}
          counts={counts}
          receiptsByUpc={state.receipts}
          selectedUpc={state.selectedUpc}
          onSelect={selectRow}
          onSearchOpen={() => dispatch(setItemReportSearchOpen(true))}
          onExportOpen={() => dispatch(setItemReportExportOpen(true))}
          storeName={storeName}
          dateLabel={dateLabel}
          receivingComplete={state.receivingComplete}
          receivingProgress={
            state.receivingError
              ? state.receivingError
              : `${state.invoicesSeen} of ${state.invoicesTotal} invoices`
          }
          receivingAvailable={receivingAvailable}
          noReceiverCount={noReceiverCount}
          noReceiverItems={noReceiverItems}
          itemCount={items.length}
        />

        <ItemReportRail
          item={selected?.item ?? null}
          action={selected?.verdict.action}
          evidence={selected?.verdict.evidence}
          receipts={
            selected ? (state.receipts[selected.item.productCode] ?? []) : []
          }
          receivingComplete={state.receivingComplete}
          lookbackDays={RECEIVING_LOOKBACK}
          periods={periods}
          actual={selectedActual}
        />
      </div>
    </div>
  );
};

export default ItemReport;
