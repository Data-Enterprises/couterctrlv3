// Hooks
import { useMemo, useState } from "react";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import {
  buildGroupRows,
  buildItemRows,
  buildPriceRows,
  buildTxnRows,
  COLS,
  GROUP_COLS,
  ITEM_COLS,
  PREVIEW_ROWS,
  PRICE_COLS,
  TXN_COLS,
} from "./utils";

// Interfaces
import type { Col, ItemGroup, ModalMode, Row, Source } from "./interfaces";
import type { TreeGroup, InvoiceCostState, ProductSummary } from "../interfaces";
import type { ServerPricePoint } from "../../../../api/pricePoints";
import type { TransactionListItem } from "../../../../interfaces";

// Components
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";

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

/* ------------------------------------------------------------------ columns */

/* ----------------------------------------------------------------- builders */

/* -------------------------------------------------------------------- modal */

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

  const PRESETS: { source: Source; title: string; caption: string }[] = [
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

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey={`export-modal:price-opt-${pageSlug}:v1`}
      defaultWidth={1140}
      defaultHeight={960}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
        <div className="min-w-0">
          <p className="cc-navy-title text-[13px]">
            Export CSV
          </p>
          <p className="text-custom-white/95 text-[10px] truncate">
            {storeName} · {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m
                  ? "bg-custom-white text-brand_navy"
                  : "text-custom-white/95 hover:text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="cc-navy-link justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {mode === "presets" ? (
        <div className="p-4">
          <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-2">
            Select data to include
          </p>
          {PRESETS.map((p) => (
            <label
              key={p.source}
              className={`flex items-start gap-2.5 py-2.5 border-b border-line_hair last:border-b-0 cursor-pointer ${
                available[p.source] ? "" : "opacity-40"
              }`}
            >
              <input
                type="radio"
                checked={source === p.source}
                onChange={() => setSource(p.source)}
                disabled={!available[p.source]}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-content">
                  {p.title}
                </p>
                <p className="text-[11px] text-content/95 mt-0.5 truncate">
                  {p.caption}
                </p>
              </div>
            </label>
          ))}
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            className="w-full mt-3 flex items-center justify-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>
          <div className="p-3.5 border-r border-line_hair">
            <p className="text-[10px] cc-caps mb-2">
              Data source
            </p>
            {PRESETS.map((p) => (
              <label
                key={p.source}
                className={`flex items-center gap-1.5 mb-1.5 cursor-pointer ${
                  available[p.source] ? "" : "opacity-40"
                }`}
              >
                <input
                  type="radio"
                  checked={source === p.source}
                  onChange={() => setSource(p.source)}
                  disabled={!available[p.source]}
                />
                <span className="text-[11.5px] text-content">{p.title}</span>
              </label>
            ))}

            <p className="text-[10px] cc-caps mt-3.5 mb-2">
              Columns
            </p>
            {COLS[source].map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-1.5 mb-1.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={picked[source].has(c.key)}
                  onChange={() => toggleCol(c.key)}
                />
                <span className="text-[11.5px] text-content">
                  {c.key === "name" ? groupNoun : c.label}
                </span>
              </label>
            ))}
          </div>

          <div className="p-3.5 flex flex-col">
            <p className="text-[10px] cc-caps mb-2">
              Preview
            </p>
            <div className="border border-line_hair rounded-md overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-fill_soft border-b border-line_hair">
                    {activeCols.map((c) => (
                      <th
                        key={c.key}
                        className="text-left px-2.5 py-1.5 text-content/95 font-semibold whitespace-nowrap"
                      >
                        {c.key === "name" ? groupNoun : c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i} className="border-b border-line_faint">
                      {activeCols.map((c) => (
                        <td
                          key={c.key}
                          className="px-2.5 py-1 text-content/95 whitespace-nowrap"
                        >
                          {r[c.key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length > PREVIEW_ROWS && (
                    <tr>
                      <td
                        colSpan={Math.max(activeCols.length, 1)}
                        className="px-2.5 py-1.5 text-[10px] text-content/95"
                      >
                        +{rows.length - PREVIEW_ROWS} more rows in download…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex-1" />
            <div className="flex items-center justify-between mt-3.5">
              <button
                onClick={onClose}
                className="text-[12px] text-content/95 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload}
                className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </ResizableModalShell>
  );
};

export default InventoryExportModal;
