// Hooks
import { useInventoryExport } from "./hooks";

// Interfaces
import type { ItemGroup } from "./interfaces";
import type {
  TreeGroup,
  InvoiceCostState,
  ProductSummary,
} from "../interfaces";
import type { ServerPricePoint } from "../../../../api/pricePoints";
import type { TransactionListItem } from "../../../../interfaces";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "../../../../components-dev/modals/ExportModalHeader";
import PresetsPane from "./components/PresetsPane";
import CustomConfig from "./components/CustomConfig";
import PreviewPane from "./components/PreviewPane";

interface InventoryExportModalProps {
  onClose: () => void;
  /** "Department" or "Vendor" — the noun this page groups by. */
  groupNoun: string;
  /** Filename fragment: "sub-department" or "vendor". */
  pageSlug: string;
  storeName: string;
  dateLabel: string;
  groups: TreeGroup[];
  itemGroups: ItemGroup[];
  /** The item on screen, whose registers have been read. */
  selected: ProductSummary | null;
  /** The server's price table for `selected`. Empty while loading, or when
   *  the fetch belongs to a previously-clicked item. */
  prices: ServerPricePoint[];
  /** Register lines for `selected`, read once a price has been opened on the
   *  page; empty until then. */
  lines: TransactionListItem[];
  /** The invoice cost lookup for `selected`, so the file holds its prices
   *  against the same cost as the screen. */
  invoice: InvoiceCostState;
}

/**
 * CSV export for both Price Opt pages. The four sources stay separate sheets
 * (a group, an item, a price, a receipt): joined, an item's totals would repeat
 * down its transactions. Price points and transactions cover the selected item
 * only, and the captions say so.
 */
const InventoryExportModal = ({
  onClose,
  groupNoun,
  pageSlug,
  storeName,
  dateLabel,
  groups,
  itemGroups,
  selected,
  prices,
  lines,
  invoice,
}: InventoryExportModalProps) => {
  const ex = useInventoryExport({
    onClose,
    groupNoun,
    pageSlug,
    groups,
    itemGroups,
    selected,
    prices,
    lines,
    invoice,
  });

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey={`export-modal:price-opt-${pageSlug}:v1`}
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        subtitle={`${storeName} · ${dateLabel}`}
        mode={ex.mode}
        onMode={ex.setMode}
        onClose={onClose}
      />

      {ex.mode === "presets" ? (
        <PresetsPane
          presets={ex.presets}
          available={ex.available}
          source={ex.source}
          onSource={ex.setSource}
          canDownload={ex.canDownload}
          onDownload={ex.handleDownload}
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>
          <CustomConfig
            presets={ex.presets}
            available={ex.available}
            source={ex.source}
            onSource={ex.setSource}
            picked={ex.picked[ex.source]}
            onToggleCol={ex.toggleCol}
            groupNoun={groupNoun}
          />
          <PreviewPane
            columns={ex.activeCols}
            rows={ex.rows}
            groupNoun={groupNoun}
            canDownload={ex.canDownload}
            onCancel={onClose}
            onDownload={ex.handleDownload}
          />
        </div>
      )}
    </ResizableModalShell>
  );
};

export default InventoryExportModal;
