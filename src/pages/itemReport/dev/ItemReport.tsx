// Hooks
import { useAppDispatch, useStoreName } from "../../../hooks";
import { useActualPricePoints } from "../../../hooks/useActualPricePoints";
import { usePricePoints } from "../../../hooks/usePricePoints";
import {
  useItemReportCtx,
  useInvoiceLines,
  useItemReportSheet,
  useItemRegisters,
} from "./hooks";
import { useItemReportRun } from "./hooks/run";

// Redux
import {
  setItemReportStoreId,
  setItemReportSearchOpen,
  setItemReportExportOpen,
  openItemReportInvoice,
} from "../../../features/dev/devItemReportSlice";

// Utils
import {
  RECEIVING_LOOKBACK_DAYS as RECEIVING_LOOKBACK,
  reportPeriods,
} from "./utils";

// Components
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import SearchPopup from "../../../components-dev/SearchPopup";
import ItemReportEntry from "./components/ItemReportEntry";
import InvoiceSheet from "./components/InvoiceSheet";
import ItemReportSheet from "./components/ItemReportSheet";
import ItemReportRail from "./rail/ItemReportRail";
import ItemReportExportModal from "./export/ItemReportExportModal";

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
const ItemReport = () => {
  const dispatch = useAppDispatch();
  const state = useItemReportCtx();

  const { actual, loadActual, resetActual } = useActualPricePoints();
  /**
   * The price table, from `cashiers/price_points`.
   *
   * The rail used to build it by walking every receipt, which listed a
   * random-weight item at package prices and pulled about 700 KB to do it.
   * One small call now; the receipts follow only when a price is opened.
   */
  const { prices, loadPrices } = usePricePoints();
  const storeName = useStoreName(state.scope?.storeid ?? state.storeId);

  const run = useItemReportRun(state, resetActual);
  useInvoiceLines(state);
  const {
    items,
    receivingAvailable,
    noReceiverItems,
    sheetRows,
    counts,
    selected,
  } = useItemReportSheet(state);
  const { selectRow, selectedActual, openPrice } = useItemRegisters(
    state,
    actual,
    loadActual,
    resetActual,
    loadPrices,
  );
  const openInvoice = state.openInvoice;

  const entry = (
    <ItemReportEntry
      stores={state.assignedStores}
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

  // The strip names the days each figure covers, the way the Sales strip does.
  const periods = reportPeriods(state.scope);
  const dateLabel = periods.tw;

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing a
          load this expensive to change one field is what that pattern
          prevents. */}
      {state.searchOpen && (
        <SearchPopup onClose={() => dispatch(setItemReportSearchOpen(false))}>
          {entry}
        </SearchPopup>
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
          noReceiverCount={noReceiverItems.length}
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
          prices={prices}
          onOpenPrice={openPrice}
        />
      </div>
    </div>
  );
};

export default ItemReport;
