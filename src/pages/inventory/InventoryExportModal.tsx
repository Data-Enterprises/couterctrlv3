import { useMemo, useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../components/modals/ResizableModalShell";
import { rowsToCsv, downloadCsv } from "../../utils/csvExport";
import {
  estimatedPricePoints,
  actualPricePoints,
  suggestPrice,
} from "./pricePoints";
import { itemCostStats, type ProductSummary } from "./inventoryData";
import type { TreeGroup } from "./InventoryTreePanel";
import type { TransactionListItem } from "../../interfaces";

/**
 * CSV export for both Price Opt pages.
 *
 * One modal, two pages, because the only thing that differs between them is
 * what a group is called — the four things worth exporting are identical, and
 * two copies would have drifted the first time a column moved.
 *
 * The four sources are deliberately not one flattened sheet. They sit at
 * different grains (a vendor, an item, a price, a receipt) and joining them
 * would repeat an item's totals down every one of its transaction rows, which
 * is how a "sales" column ends up double-counted in a pivot table.
 *
 * Scope is bounded by what the page actually holds, and the preset captions say
 * so rather than implying more. Registers are read one item at a time, so price
 * points and transactions cover the selected item and no other — exporting them
 * for a whole department would mean hundreds of two-step fetches nobody asked
 * for.
 */

type ModalMode = "presets" | "custom";
type Source = "groups" | "items" | "prices" | "transactions";

/** A group's items, already rolled up. The department page has one of these at
 *  a time; the vendor page has every one of them, since its rows are all in
 *  hand from the start. */
export interface ItemGroup {
  label: string;
  products: ProductSummary[];
}

interface Props {
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
  /** Register lines for `selected`. Empty while loading, or when the fetch
   *  belongs to a previously-clicked item. */
  lines: TransactionListItem[];
}

/** Rows are pre-formatted string/number maps rather than typed records, so one
 *  column list and one cell lookup serve all four sources. */
type Row = Record<string, string | number>;

interface Col {
  key: string;
  label: string;
  defaultOn: boolean;
}

const PREVIEW_ROWS = 5;
const money = (n: number) => n.toFixed(2);
const pct = (n: number | null) => (n === null ? "" : n.toFixed(2));
const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/* ------------------------------------------------------------------ columns */

const GROUP_COLS: Col[] = [
  { key: "name", label: "Name", defaultOn: true },
  { key: "id", label: "ID", defaultOn: false },
  { key: "sales", label: "Sales", defaultOn: true },
  { key: "items", label: "Items", defaultOn: true },
];

const ITEM_COLS: Col[] = [
  { key: "group", label: "Group", defaultOn: true },
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "sales", label: "Sales", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "qty", label: "Rings", defaultOn: false },
  { key: "unitCost", label: "Cost / unit", defaultOn: true },
  { key: "marginPct", label: "GM%", defaultOn: true },
  { key: "prices", label: "Est. prices", defaultOn: true },
  { key: "topPrice", label: "Top price", defaultOn: true },
];

const PRICE_COLS: Col[] = [
  { key: "source", label: "Source", defaultOn: true },
  { key: "price", label: "Price", defaultOn: true },
  { key: "priceType", label: "Type", defaultOn: true },
  { key: "trans", label: "Trans", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "sales", label: "Sales", defaultOn: false },
  { key: "days", label: "Days seen", defaultOn: true },
  { key: "lastSeen", label: "Last seen", defaultOn: true },
  { key: "marginPct", label: "GM%", defaultOn: true },
  { key: "marginPerUnit", label: "Margin / unit", defaultOn: false },
  { key: "perDay", label: "Units / day", defaultOn: true },
  { key: "profitPerDay", label: "Profit / day", defaultOn: true },
  { key: "suggested", label: "Suggested", defaultOn: true },
];

const TXN_COLS: Col[] = [
  { key: "date", label: "Date", defaultOn: true },
  { key: "saleId", label: "Sale ID", defaultOn: true },
  { key: "line", label: "Line", defaultOn: false },
  { key: "terminal", label: "Terminal", defaultOn: true },
  { key: "cashier", label: "Cashier", defaultOn: true },
  { key: "qty", label: "Qty", defaultOn: true },
  { key: "unitPrice", label: "Unit price", defaultOn: true },
  { key: "netSales", label: "Net sales", defaultOn: true },
  { key: "priceType", label: "Type", defaultOn: true },
];

const COLS: Record<Source, Col[]> = {
  groups: GROUP_COLS,
  items: ITEM_COLS,
  prices: PRICE_COLS,
  transactions: TXN_COLS,
};

/* ----------------------------------------------------------------- builders */

const buildGroupRows = (groups: TreeGroup[]): Row[] =>
  groups.map((g) => ({
    name: g.label,
    id: g.id,
    sales: money(g.sales),
    // Blank rather than 0 on the department page, where a count can't exist
    // until the department has been opened.
    items: g.itemCount ?? "",
  }));

const buildItemRows = (itemGroups: ItemGroup[]): Row[] =>
  itemGroups.flatMap((g) =>
    g.products.map((p) => {
      const stats = itemCostStats(p);
      const est = estimatedPricePoints(p.rows);
      return {
        group: g.label,
        upc: p.productCode,
        description: p.description,
        sales: money(p.sales),
        units: num(p.units),
        qty: num(p.qty),
        unitCost: stats.unitCost === null ? "" : money(stats.unitCost),
        marginPct: pct(stats.marginPct),
        prices: est.length,
        // Sorted by sales, so this is the price that made the most money —
        // not the one rung most often, which the actual side answers.
        topPrice: est.length > 0 ? money(est[0].price) : "",
      };
    }),
  );

const buildPriceRows = (
  product: ProductSummary,
  lines: TransactionListItem[],
): Row[] => {
  const { unitCost } = itemCostStats(product);
  const act = actualPricePoints(lines, unitCost ?? 0);
  const suggestion = suggestPrice(act);
  const best = suggestion?.best.point ?? null;

  const rows: Row[] = estimatedPricePoints(product.rows).map((p) => {
    const perDay = p.daysSeen > 0 ? p.units / p.daysSeen : 0;
    return {
      source: "Estimated",
      price: money(p.price),
      priceType: p.priceType,
      // Daily roll-ups have no transaction count — blank, never 0, so the
      // column can't be summed into a total that means nothing.
      trans: "",
      units: num(p.units),
      sales: money(p.netSales),
      days: p.daysSeen,
      lastSeen: p.lastSeen,
      marginPct: pct(p.marginPct),
      marginPerUnit: money(p.marginPerUnit),
      perDay: perDay.toFixed(2),
      profitPerDay: money(perDay * p.marginPerUnit),
      // Estimated prices are divided out of a day's totals, so they can name a
      // figure no customer was ever charged. They inform and never suggest.
      suggested: "",
    };
  });

  const actualRows = (
    points: typeof act.exact,
    label: string,
    rankable: boolean,
  ): Row[] =>
    points.map((p) => {
      const perDay = p.daysSeen > 0 ? p.qty / p.daysSeen : 0;
      return {
        source: label,
        price: money(p.price),
        priceType: p.priceType,
        trans: p.trans,
        units: num(p.qty),
        sales: money(p.sales),
        days: p.daysSeen,
        lastSeen: p.lastSeen,
        marginPct: pct(p.marginPct),
        marginPerUnit: money(p.marginPerUnit),
        perDay: perDay.toFixed(2),
        profitPerDay: money(perDay * p.marginPerUnit),
        suggested: rankable && p === best ? "Yes" : "",
      };
    });

  rows.push(
    ...actualRows(
      act.exact,
      act.isWeighted ? "Actual ($/lb)" : "Actual (exact)",
      true,
    ),
    // A multi-unit ring divided by its quantity is a derived figure, so it's
    // never the suggestion — same rule the panel applies.
    ...actualRows(act.averaged, "Actual (averaged)", false),
  );
  return rows;
};

const buildTxnRows = (lines: TransactionListItem[]): Row[] =>
  [...lines]
    .sort((a, b) => b.sale_date.localeCompare(a.sale_date))
    .map((t) => {
      const qty = t.qty ?? 1;
      return {
        date: t.sale_date,
        saleId: t.sale_id,
        line: t.line_number,
        terminal: t.terminal,
        cashier: t.cashier_name,
        qty: num(qty),
        unitPrice: money(qty > 0 ? t.net_sales / qty : t.net_sales),
        netSales: money(t.net_sales),
        priceType: t.price_type || "REG",
      };
    });

/* -------------------------------------------------------------------- modal */

const InventoryExportModal = ({
  onClose,
  groupNoun,
  pageSlug,
  storeName,
  dateLabel,
  groups,
  itemGroups,
  selected,
  lines,
}: Props) => {
  const groupRows = useMemo(() => buildGroupRows(groups), [groups]);
  const itemRows = useMemo(() => buildItemRows(itemGroups), [itemGroups]);
  const priceRows = useMemo(
    () => (selected ? buildPriceRows(selected, lines) : []),
    [selected, lines],
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
        : "No register lines read for this item",
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div className="min-w-0">
          <p className="text-custom-white text-[13px] font-semibold">
            Export CSV
          </p>
          <p className="text-custom-white/70 text-[10px] truncate">
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
                  ? "bg-custom-white text-[#1e2a4a]"
                  : "text-custom-white/70 hover:text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {mode === "presets" ? (
        <div className="p-4">
          <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium mb-2">
            Select data to include
          </p>
          {PRESETS.map((p) => (
            <label
              key={p.source}
              className={`flex items-start gap-2.5 py-2.5 border-b border-gray-100 last:border-b-0 cursor-pointer ${
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
                <p className="text-[11px] text-content/50 mt-0.5 truncate">
                  {p.caption}
                </p>
              </div>
            </label>
          ))}
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            className="w-full mt-3 flex items-center justify-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>
          <div className="p-3.5 border-r border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
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

            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mt-3.5 mb-2">
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
              Preview
            </p>
            <div className="border border-gray-100 rounded-md overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {activeCols.map((c) => (
                      <th
                        key={c.key}
                        className="text-left px-2.5 py-1.5 text-content/55 font-semibold whitespace-nowrap"
                      >
                        {c.key === "name" ? groupNoun : c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {activeCols.map((c) => (
                        <td
                          key={c.key}
                          className="px-2.5 py-1 text-content/80 whitespace-nowrap"
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
                        className="px-2.5 py-1.5 text-[10px] text-content/35"
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
                className="text-[12px] text-content/50 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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
