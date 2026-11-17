// Hooks
import { useItemReportExport } from "./hooks";

// Interfaces
import type { SheetRow, ReceiptLine } from "../interfaces";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "../../../../components-dev/modals/ExportModalHeader";
import ExportFilters from "./components/ExportFilters";
import PresetList from "./components/PresetList";
import CustomColumns from "./components/CustomColumns";
import PreviewPane from "./components/PreviewPane";

interface ItemReportExportModalProps {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  lookbackDays: number;
  rows: SheetRow[];
  receiptsByUpc: Record<string, ReceiptLine[]>;
  receivingComplete: boolean;
}

/**
 * CSV export for Item Actions.
 *
 * The sheet is the deliverable and this is the same sheet in a file — same
 * rows, same order, same action, same evidence sentence. Anyone comparing the
 * screen against the download should find them identical, because the export is
 * how most of this report is actually read: away from the app, in the tool
 * these people already live in.
 *
 * The evidence column carries the written finding verbatim. A row that says
 * "cost up 6% across the last three deliveries and the shelf price didn't
 * follow" survives being opened a week later by someone who wasn't here;
 * eleven columns of percentages do not.
 *
 * Three grains, kept apart. Items are one row per UPC, price periods one row
 * per price held, receipts one row per delivery — joining them would repeat an
 * item's totals down every period and multiply its sales in a pivot.
 */
const ItemReportExportModal = ({
  onClose,
  storeName,
  dateLabel,
  lookbackDays,
  rows,
  receiptsByUpc,
  receivingComplete,
}: ItemReportExportModalProps) => {
  const ex = useItemReportExport({
    onClose,
    storeName,
    dateLabel,
    lookbackDays,
    rows,
    receiptsByUpc,
    receivingComplete,
  });
  const custom = ex.mode === "custom";

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:item-report:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        subtitle={`${storeName} · ${dateLabel}`}
        mode={ex.mode}
        onMode={ex.setMode}
        onClose={onClose}
      />

      {!receivingComplete && (
        <div className="px-4 pt-3">
          <div className="cc-notice text-[11.5px] leading-snug">
            Deliveries are still being read. Actions that depend on receivers
            are provisional, and receiving columns will be blank for items the
            walk hasn't reached.
          </div>
        </div>
      )}

      {(custom || ex.preset.filters.length > 0) && (
        <ExportFilters
          custom={custom}
          presetFilters={ex.preset.filters}
          actionOpts={ex.actionOpts}
          actionPick={ex.actionPick}
          onActionPick={ex.setActionPick}
          vendorOpts={ex.vendorOpts}
          vendorPick={ex.vendorPick}
          onVendorPick={ex.setVendorPick}
          deptOpts={ex.deptOpts}
          deptPick={ex.deptPick}
          onDeptPick={ex.setDeptPick}
        />
      )}

      {!custom ? (
        <PresetList
          presetKey={ex.presetKey}
          onPreset={ex.setPresetKey}
          rowsOf={ex.rowsOf}
          rowCount={ex.rowsOut.length}
          colCount={ex.cols.length}
          receivingComplete={receivingComplete}
          canDownload={ex.canDownload}
          onDownload={ex.handleDownload}
        />
      ) : (
        <div
          className="grid flex-1 min-h-0"
          style={{ gridTemplateColumns: "220px 1fr" }}
        >
          <CustomColumns
            source={ex.source}
            onSource={ex.setSource}
            rowsOf={ex.rowsOf}
            picked={ex.picked[ex.source]}
            onToggleCol={ex.toggleCol}
          />
          <PreviewPane
            columns={ex.activeCols}
            rows={ex.rowsOut}
            canDownload={ex.canDownload}
            onCancel={onClose}
            onDownload={ex.handleDownload}
          />
        </div>
      )}
    </ResizableModalShell>
  );
};

export default ItemReportExportModal;
