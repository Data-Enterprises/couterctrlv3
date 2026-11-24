// Hooks
import { useMemo, useState } from "react";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../../utils/csvExport";
import {
  buildGroupRows,
  buildItemRows,
  buildPriceRows,
  buildTxnRows,
  COLS,
  GROUP_COLS,
  ITEM_COLS,
  PRICE_COLS,
  TXN_COLS,
} from "../utils";

// Interfaces
import type {
  Col,
  ItemGroup,
  ModalMode,
  Preset,
  Row,
  Source,
} from "../interfaces";
import type {
  TreeGroup,
  InvoiceCostState,
  ProductSummary,
} from "../../interfaces";
import type { ServerPricePoint } from "../../../../../api/pricePoints";
import type { TransactionListItem } from "../../../../../interfaces";

interface InventoryExportInput {
  onClose: () => void;
  groupNoun: string;
  pageSlug: string;
  groups: TreeGroup[];
  itemGroups: ItemGroup[];
  selected: ProductSummary | null;
  prices: ServerPricePoint[];
  lines: TransactionListItem[];
  invoice: InvoiceCostState;
}

/**
 * The export pop-up's state: the four sheets' rows, which ones have data, the
 * chosen source and columns per source, the preset list and the download.
 */
export const useInventoryExport = ({
  onClose,
  groupNoun,
  pageSlug,
  groups,
  itemGroups,
  selected,
  prices,
  lines,
  invoice,
}: InventoryExportInput) => {
  const groupRows = useMemo(() => buildGroupRows(groups), [groups]);
  const itemRows = useMemo(() => buildItemRows(itemGroups), [itemGroups]);
  const priceRows = useMemo(
    () => (selected ? buildPriceRows(selected, prices, invoice) : []),
    [selected, prices, invoice],
  );
  const txnRows = useMemo(() => buildTxnRows(lines), [lines]);

  const rowsOf: Record<Source, Row[]> = {
    groups: groupRows,
    items: itemRows,
    prices: priceRows,
    transactions: txnRows,
  };

  const available: Record<Source, boolean> = {
    groups: groupRows.length > 0,
    items: itemRows.length > 0,
    prices: priceRows.length > 0,
    transactions: txnRows.length > 0,
  };

  const [mode, setMode] = useState<ModalMode>("presets");
  // Opens on whatever the reader has drilled to. Someone who has an item on
  // screen came here for that item, not for the group list they passed through.
  const [source, setSource] = useState<Source>(() =>
    available.prices ? "prices" : available.items ? "items" : "groups",
  );
  const [picked, setPicked] = useState<Record<Source, Set<string>>>(() => {
    const seed = (cols: Col[]) =>
      new Set(cols.filter((c) => c.defaultOn).map((c) => c.key));
    return {
      groups: seed(GROUP_COLS),
      items: seed(ITEM_COLS),
      prices: seed(PRICE_COLS),
      transactions: seed(TXN_COLS),
    };
  });

  const toggleCol = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev[source]);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [source]: next };
    });

  const itemScope =
    itemGroups.length === 1
      ? itemGroups[0].label
      : `${itemGroups.length} ${groupNoun.toLowerCase()}s`;

  const presets: Preset[] = [
    {
      source: "groups",
      title: `All ${groupNoun.toLowerCase()}s — summary`,
      caption:
        groupNoun === "Department"
          ? `${groupRows.length} rows · item counts only for departments you've opened`
          : `${groupRows.length} rows`,
    },
    {
      source: "items",
      title: "Items — one row per UPC",
      caption: available.items
        ? `${itemRows.length} rows · ${itemScope}`
        : `Open a ${groupNoun.toLowerCase()} first`,
    },
    {
      source: "prices",
      title: "Current item — price points",
      caption: available.prices
        ? `${priceRows.length} rows · ${selected?.description} · estimated and actual, with the suggested price flagged`
        : "Select an item first",
    },
    {
      source: "transactions",
      title: "Current item — transactions",
      caption: available.transactions
        ? `${txnRows.length} rows · every register line behind the actual prices`
        : "Open a price's transactions on the page to read them first",
    },
  ];

  const activeCols = COLS[source].filter((c) => picked[source].has(c.key));
  const presetCols = COLS[source];
  const cols = mode === "presets" ? presetCols : activeCols;
  const rows = rowsOf[source];
  const canDownload = available[source] && cols.length > 0;

  const handleDownload = () => {
    downloadCsv(
      rowsToCsv(
        cols.map((c) => c.label),
        rows.map((r) => cols.map((c) => r[c.key] ?? "")),
      ),
      `price-opt-${pageSlug}-${source}.csv`,
    );
    onClose();
  };

  return {
    available,
    mode,
    setMode,
    source,
    setSource,
    picked,
    toggleCol,
    presets,
    activeCols,
    rows,
    canDownload,
    handleDownload,
  };
};
