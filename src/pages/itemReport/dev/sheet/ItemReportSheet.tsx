// Hooks
import { useSheetRows } from "./hooks";

// Interfaces
import type {
  ActionKind,
  ReportItem,
  ReceiptLine,
  SheetRow,
} from "../interfaces";

// Components
import SheetHeader from "./components/SheetHeader";
import ActionPiles from "./components/ActionPiles";
import NoReceiverBanner from "./components/NoReceiverBanner";
import SheetColumnHead from "./components/SheetColumnHead";
import ActionRow from "./components/ActionRow";

interface ItemReportSheetProps {
  rows: SheetRow[];
  counts: Record<ActionKind, number>;
  receiptsByUpc: Record<string, ReceiptLine[]>;
  selectedUpc: string | null;
  onSelect: (row: SheetRow) => void;
  onSearchOpen: () => void;
  onExportOpen: () => void;
  storeName: string;
  dateLabel: string;
  receivingComplete: boolean;
  receivingProgress: string;
  /** False when `receivers/` returned nothing at all for this store. */
  receivingAvailable: boolean;
  /** Items with no receiver invoice in the lookback, and the list's size. Shown
   *  as one figure above the sheet — it is a fact about the data, not a verdict
   *  about any row, and it used to be both. */
  noReceiverCount: number;
  /** The items behind that count. The banner states the number; this is what
   *  the number is, one click away — a count nobody can enumerate is a claim
   *  the reader has to take on faith. */
  noReceiverItems: ReportItem[];
  itemCount: number;
}

/**
 * The report itself: one row per item, its action, and the evidence for it.
 *
 * A spreadsheet on purpose. The people reading this live in Excel, and the
 * value isn't in replacing that with a dashboard — it's in a sheet that has
 * already done the reading. Columns stay aligned and scannable; what's added is
 * that every row states what to do and why, so scanning down the page is the
 * diagnosis rather than the input to one.
 *
 * Rows stay neutral and the action chip carries the colour. The reasoning
 * behind each chip lives in the rail's verdict strip and in the export's
 * evidence column, so the rows keep their vertical rhythm.
 */
const ItemReportSheet = ({
  rows,
  counts,
  receiptsByUpc,
  selectedUpc,
  onSelect,
  onSearchOpen,
  onExportOpen,
  storeName,
  dateLabel,
  receivingComplete,
  receivingProgress,
  receivingAvailable,
  noReceiverCount,
  noReceiverItems,
  itemCount,
}: ItemReportSheetProps) => {
  const { deptOpts, vendorOpts, visible } = useSheetRows(rows);
  const noLastYear = rows.length > 0 && rows.every((r) => !r.item.ly);

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <SheetHeader
          storeName={storeName}
          dateLabel={dateLabel}
          itemCount={rows.length}
          onSearchOpen={onSearchOpen}
          onExportOpen={onExportOpen}
        />

        <ActionPiles
          counts={counts}
          deptOpts={deptOpts}
          vendorOpts={vendorOpts}
        />

        {!receivingComplete && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-severity_watch_bg text-severity_watch_text text-[11px]">
            Reading deliveries — {receivingProgress}. Actions that depend on
            receivers are provisional until this finishes.
          </div>
        )}

        {/* Said once when nothing in the list has a last year. Each verdict then
            falls back to last week without saying so, and "a seasonal dip is
            not mistaken for a problem" can't hold for this store (finding T). */}
        {noLastYear && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-fill_muted text-[11px] text-content">
            No last-year sales on file for this store, so trends compare against
            last week only. A seasonal dip can read as a problem.
          </div>
        )}

        {receivingComplete && noReceiverCount > 0 && (
          <NoReceiverBanner
            receivingAvailable={receivingAvailable}
            items={noReceiverItems}
            itemCount={itemCount}
          />
        )}

        <SheetColumnHead />

        <div className="cc-scroll rounded-b-xl">
          {visible.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/95">
              No items matched
            </div>
          )}

          {visible.map((row) => (
            <ActionRow
              key={row.item.productCode}
              row={row}
              receipts={receiptsByUpc[row.item.productCode] ?? []}
              isSelected={row.item.productCode === selectedUpc}
              receivingComplete={receivingComplete}
              onSelect={() => onSelect(row)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemReportSheet;
