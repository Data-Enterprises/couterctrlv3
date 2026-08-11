import { useMemo, useState } from "react";
import { useAppSelector, useStoreName } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate, formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { useActualPricePoints } from "../inventory/useActualPricePoints";
import ItemReportEntry from "./ItemReportEntry";
import ItemReportSheet, { type SheetRow } from "./ItemReportSheet";
import ItemReportRail from "./ItemReportRail";
import ItemReportExportModal from "./ItemReportExportModal";
import { useReceivingWalk } from "./useReceivingWalk";
import {
  fetchDepartments,
  fetchRowsForDepartments,
  lwWindow,
  lyWindow,
  type ReportScope,
} from "./itemReportData";
import {
  buildPriceEras,
  buildReport,
  buildRollup,
  verdictFor,
} from "./itemReportMetrics";
import type { ParsedUpload } from "./parseUpload";
import type { SubDeptMargin } from "../../interfaces";

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
  const { url, token } = useAppSelector((s) => s.app);
  const { startDate, endDate, lastStore } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);

  const [storeId, setStoreId] = useState(lastStore || 0);
  const [scope, setScope] = useState<ReportScope | null>(null);
  const [upcs, setUpcs] = useState<string[]>([]);
  const [rows, setRows] = useState<{
    ty: SubDeptMargin[];
    lw: SubDeptMargin[];
    ly: SubDeptMargin[];
  }>({ ty: [], lw: [], ly: [] });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedUpc, setSelectedUpc] = useState<string | null>(null);

  const { receiving, startWalk, resetWalk } = useReceivingWalk();
  const { actual, loadActual, resetActual } = useActualPricePoints();
  const storeName = useStoreName(scope?.storeid ?? storeId);

  const run = async (parsed: ParsedUpload) => {
    if (!storeId) {
      toast.warn("Please select a store");
      return;
    }
    const next: ReportScope = {
      url,
      token,
      storeid: storeId,
      start: formatGoliathDate(startDate),
      end: formatGoliathDate(endDate),
    };
    setSearchOpen(false);
    setLoading(true);
    setSelectedUpc(null);
    resetActual();
    resetWalk();

    try {
      setLoadingMessage("Finding departments…");
      const depts = await fetchDepartments(next);
      if (depts.length === 0) {
        toast.warn("No departments sold in that window");
        return;
      }

      // A file that named its departments lets us skip the rest — usually the
      // difference between a dozen departments and all of them. An unmatched
      // name falls back to reading everything rather than silently returning a
      // short report.
      const named = new Set(parsed.departments.map((d) => d.toLowerCase()));
      const narrowed =
        named.size > 0
          ? depts.filter((d) => named.has(d.description.toLowerCase()))
          : [];
      const ids = (narrowed.length > 0 ? narrowed : depts).map((d) => d.id);

      setLoadingMessage(`Reading ${ids.length} departments…`);
      const ty = await fetchRowsForDepartments(next, ids, next);

      // Both baselines go out together — they're independent reads, and
      // serialising them would double the wait for nothing.
      setLoadingMessage("Reading last week and last year…");
      const [lw, ly] = await Promise.all([
        fetchRowsForDepartments(next, ids, lwWindow(next)),
        fetchRowsForDepartments(next, ids, lyWindow(next)),
      ]);

      setRows({ ty, lw, ly });
      setUpcs(parsed.upcs);
      setScope(next);

      // Deliberately not awaited. The sheet is readable without it, and the
      // walk both fills in receipts and discovers the never-scanned rows.
      void startWalk(next);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not build the report",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const windowDays = scope ? dayCount(scope.start, scope.end) : 30;

  const items = useMemo(
    () => buildReport(upcs, rows.ty, rows.lw, rows.ly, receiving.receiptsByUpc),
    [upcs, rows, receiving.receiptsByUpc],
  );

  const sheetRows: SheetRow[] = useMemo(() => {
    if (!scope) return [];
    return items.map((item) => {
      const receipts = receiving.receiptsByUpc.get(item.productCode) ?? [];
      return {
        item,
        verdict: verdictFor(
          item,
          receipts,
          buildPriceEras(item, receipts),
          scope.start,
          windowDays,
          receiving.lookbackDays,
          receiving.complete,
        ),
      };
    });
  }, [items, scope, windowDays, receiving]);

  const counts = useMemo(
    () => buildRollup(sheetRows.map((r) => r.verdict)),
    [sheetRows],
  );

  const selected = sheetRows.find((r) => r.item.productCode === selectedUpc);

  /**
   * Registers load on selection. Two calls for one item, never across the
   * sheet — and no verdict depends on them, so a reader who clicks nothing
   * loses nothing.
   */
  const selectRow = (row: SheetRow) => {
    if (!scope) return;
    setSelectedUpc(row.item.productCode);
    loadActual(
      row.item.productCode,
      row.item.description,
      scope.storeid,
      scope.start,
      scope.end,
    );
  };

  const entry = (
    <ItemReportEntry
      stores={assignedStores}
      storeId={storeId}
      onStoreSelect={setStoreId}
      onRun={run}
      loading={loading}
      loadingMessage={loadingMessage || "Building report..."}
    />
  );

  if (loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message={loadingMessage || "Building report..."} />
      </div>
    );
  }

  if (!scope || items.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry}
      </div>
    );
  }

  const dateLabel = `${formatDate(scope.start)} – ${formatDate(scope.end)}`;

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing a
          load this expensive to change one field is what that pattern
          prevents. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      {exportOpen && (
        <ItemReportExportModal
          onClose={() => setExportOpen(false)}
          storeName={storeName}
          dateLabel={dateLabel}
          lookbackDays={receiving.lookbackDays}
          rows={sheetRows}
          receiptsByUpc={receiving.receiptsByUpc}
          receivingComplete={receiving.complete}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <ItemReportSheet
          rows={sheetRows}
          counts={counts}
          receiptsByUpc={receiving.receiptsByUpc}
          selectedUpc={selectedUpc}
          onSelect={selectRow}
          onSearchOpen={() => setSearchOpen(true)}
          onExportOpen={() => setExportOpen(true)}
          storeName={storeName}
          dateLabel={dateLabel}
          receivingComplete={receiving.complete}
          receivingProgress={
            receiving.error
              ? receiving.error
              : `${receiving.invoicesSeen} of ${receiving.invoicesTotal} invoices`
          }
        />

        <ItemReportRail
          item={selected?.item ?? null}
          receipts={
            selected
              ? (receiving.receiptsByUpc.get(selected.item.productCode) ?? [])
              : []
          }
          receivingComplete={receiving.complete}
          lookbackDays={receiving.lookbackDays}
          actual={actual}
        />
      </div>
    </div>
  );
};

export default ItemReport;
