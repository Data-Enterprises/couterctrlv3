import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector, useStoreName } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatDateSimple } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { useActualPricePoints } from "../inventory/useActualPricePoints";
import {
  setItemReportStoreId,
  setItemReportLoading,
  startItemReportSearch,
  setItemReportResults,
  setItemReportSelected,
  setItemReportSearchOpen,
  setItemReportExportOpen,
  clearItemReportHandoff,
  setItemReportSource,
} from "../../features/itemReportSlice";
import ItemReportEntry from "./ItemReportEntry";
import type { SubDeptMargin } from "../../interfaces";
import type { ItemReportHandoff } from "../../features/itemReportSlice";
import { collectCriticalItems } from "../sales/components/itemGrading";
import { scopeToStoreNumber } from "../sales/shared/ledgerUtils";
import ItemReportSheet, { type SheetRow } from "./ItemReportSheet";
import ItemReportRail from "./ItemReportRail";
import ItemReportExportModal from "./ItemReportExportModal";
import { useReceivingWalk } from "./useReceivingWalk";
import {
  fetchDepartmentsWide,
  fetchRowsForDepartments,
  lwWindow,
  lyWindow,
  weekEnding,
  RECEIVING_LOOKBACK_DAYS as RECEIVING_LOOKBACK,
  type ReportScope,
} from "./itemReportData";
import {
  buildPriceEras,
  buildReport,
  buildRollup,
  verdictFor,
} from "./itemReportMetrics";

/**
 * Item Report — a critical list, diagnosed and handed over.
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
 * Receipts run behind the sheet and are an entry point in their own right, not
 * a lookup: an item delivered and never scanned has no sales row anywhere, so
 * the upload could not have contained it. Those rows are discovered here.
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
  const { singleDate } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);
  const state = useAppSelector((s) => s.itemReport);

  const { startWalk, cancelWalk } = useReceivingWalk();
  const { actual, loadActual, resetActual } = useActualPricePoints();
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
        const retained = new Set(upcs);
        for (const row of [
          ...preloaded.rows.ty,
          ...preloaded.rows.lw,
          ...preloaded.rows.ly,
        ])
          retained.add(String(row.product_code));
        void startWalk(next, [...retained]);
        return;
      }

      dispatch(
        setItemReportLoading({
          loading: true,
          message: "Finding departments…",
        }),
      );
      const depts = await fetchDepartmentsWide(next);
      if (depts.length === 0) {
        toast.warn("No departments sold in that window");
        return;
      }

      // A file that named its departments lets us skip the rest — usually the
      // difference between a dozen departments and all of them. An unmatched
      // name falls back to reading everything rather than silently returning a
      // short report.
      const named = new Set(uploadDepartments.map((d) => d.toLowerCase()));
      const narrowed =
        named.size > 0
          ? depts.filter((d) => named.has(d.description.toLowerCase()))
          : [];
      const ids = (narrowed.length > 0 ? narrowed : depts).map((d) => d.id);

      dispatch(
        setItemReportLoading({
          loading: true,
          message: `Reading ${ids.length} departments…`,
        }),
      );
      const ty = await fetchRowsForDepartments(next, ids, next);

      // Both baselines go out together — they're independent reads, and
      // serialising them would double the wait for nothing.
      dispatch(
        setItemReportLoading({
          loading: true,
          message: "Reading last week and last year…",
        }),
      );
      const [lw, ly] = await Promise.all([
        fetchRowsForDepartments(next, ids, lwWindow(next)),
        fetchRowsForDepartments(next, ids, lyWindow(next)),
      ]);

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
        listUpcs = [...new Set(graded.map((g) => g.productCode))];
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
        }),
      );

      // What the walk keeps: the uploaded codes, plus anything that sold in any
      // of the three windows. That union is exactly the widest set the "all
      // found" scope can ever surface, so nothing reachable is discarded and
      // nothing unreachable is carried.
      const retain = new Set(listUpcs);
      for (const row of [...tyRows, ...lwRows, ...lyRows])
        retain.add(String(row.product_code));

      // Deliberately not awaited — the sheet is readable before the walk lands,
      // and receipts fill in behind it.
      void startWalk(next, [...retain]);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not build the report",
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
  const uploadedCount = useMemo(
    () => items.filter((i) => !i.discovered).length,
    [items],
  );

  const scopedItems = useMemo(
    () =>
      state.itemScope === "uploaded"
        ? items.filter((i) => !i.discovered)
        : items,
    [items, state.itemScope],
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
            RECEIVING_LOOKBACK,
            state.receivingComplete,
          ),
        };
      }),
    [scopedItems, state.receipts, state.receivingComplete, windowDays],
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
    dispatch(setItemReportSelected(row.item.productCode));
    loadActual(
      row.item.productCode,
      row.item.description,
      state.scope.storeid,
      state.scope.start,
      state.scope.end,
    );
  };

  const entry = (
    <ItemReportEntry
      stores={assignedStores}
      storeId={state.storeId}
      onStoreSelect={(id) => dispatch(setItemReportStoreId(id))}
      onRun={run}
      loading={state.loading}
      loadingMessage={state.loadingMessage || "Building report..."}
    />
  );

  if (state.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={state.loadingMessage || "Building report..."}
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
          uploadedCount={uploadedCount}
          allCount={items.length}
          receiptsByUpc={state.receipts}
          selectedUpc={state.selectedUpc}
          onSelect={selectRow}
          onSearchOpen={() => dispatch(setItemReportSearchOpen(true))}
          onExportOpen={() => dispatch(setItemReportExportOpen(true))}
          storeName={storeName}
          dateLabel={dateLabel}
          sourceLabel={state.sourceLabel}
          basisLabel={state.basisLabel}
          receivingComplete={state.receivingComplete}
          receivingProgress={
            state.receivingError
              ? state.receivingError
              : `${state.invoicesSeen} of ${state.invoicesTotal} invoices`
          }
        />

        <ItemReportRail
          item={selected?.item ?? null}
          receipts={
            selected ? (state.receipts[selected.item.productCode] ?? []) : []
          }
          receivingComplete={state.receivingComplete}
          lookbackDays={RECEIVING_LOOKBACK}
          periods={periods}
          actual={actual}
        />
      </div>
    </div>
  );
};

export default ItemReport;
