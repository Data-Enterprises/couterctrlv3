// Utils
import { itemCostStats } from "../../utils";
import {
  estimatedPricePoints,
  pricePointsFromServer,
  suggestPrice,
} from "../../../../../utils/pricePoints";
import { resolveUnitCost } from "../../utils/invoiceCost";

// Interfaces
import type { Col, ItemGroup, Row, Source } from "../interfaces";
import type {
  InvoiceCostState,
  ProductSummary,
  TreeGroup,
} from "../../interfaces";
import type { ServerPricePoint } from "../../../../../api/pricePoints";
import type { TransactionListItem } from "../../../../../interfaces";

/** The preview's row count, and how money, percents and quantities print in the file. */
export const PREVIEW_ROWS = 5;
export const money = (n: number) => n.toFixed(2);
export const pct = (n: number | null) => (n === null ? "" : n.toFixed(2));
export const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** The Groups export's columns. */
export const GROUP_COLS: Col[] = [
  { key: "name", label: "Name", defaultOn: true },
  { key: "id", label: "ID", defaultOn: false },
  { key: "sales", label: "Sales", defaultOn: true },
  { key: "items", label: "Items", defaultOn: true },
];

/** The Items export's columns. */
export const ITEM_COLS: Col[] = [
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

/** The Prices export's columns. */
export const PRICE_COLS: Col[] = [
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

/** The Transactions export's columns. */
export const TXN_COLS: Col[] = [
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

/** Each export source's columns. */
export const COLS: Record<Source, Col[]> = {
  groups: GROUP_COLS,
  items: ITEM_COLS,
  prices: PRICE_COLS,
  transactions: TXN_COLS,
};

/** The Groups export's rows, one per tree group. */
export const buildGroupRows = (groups: TreeGroup[]): Row[] =>
  groups.map((g) => ({
    name: g.label,
    id: g.id,
    sales: money(g.sales),
    // Blank rather than 0 on the department page, where a count can't exist
    // until the department has been opened.
    items: g.itemCount ?? "",
  }));

/** The Items export's rows, one per product in each group. */
export const buildItemRows = (itemGroups: ItemGroup[]): Row[] =>
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

/** The Prices export's rows for one product. */
export const buildPriceRows = (
  product: ProductSummary,
  prices: ServerPricePoint[],
  invoice: InvoiceCostState,
): Row[] => {
  // The same resolution the panel makes, so the file and the screen agree on
  // cost, margin and which price, if any, is suggested.
  const weighed = product.rows.some((r) => r.weight > 0);
  const cost = resolveUnitCost(
    itemCostStats(product).unitCost,
    invoice.upc === product.productCode ? invoice.cost : null,
    weighed,
  );
  const override = cost.source === "invoice" ? cost.unitCost : null;
  const { unitCost } = itemCostStats(product, override);
  const act = pricePointsFromServer(prices, unitCost ?? 0);
  const suggestion = suggestPrice(act);
  const best = suggestion?.best.point ?? null;

  const rows: Row[] = estimatedPricePoints(product.rows, override).map((p) => {
    const perDay = p.daysSeen > 0 ? p.units / p.daysSeen : 0;
    return {
      source: "Daily average",
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
      act.isWeighted ? "Charged ($/lb)" : "Charged (exact)",
      true,
    ),
    // A multi-unit ring divided by its quantity is a derived figure, so it's
    // never the suggestion — same rule the panel applies.
    ...actualRows(act.averaged, "Charged (averaged)", false),
  );
  return rows;
};

/** The Transactions export's rows, newest first. */
export const buildTxnRows = (lines: TransactionListItem[]): Row[] =>
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
        // Per pound on a weighed line, as the price table reads it.
        unitPrice: money(
          t.weight
            ? t.net_sales / t.weight
            : qty > 0
              ? t.net_sales / qty
              : t.net_sales,
        ),
        netSales: money(t.net_sales),
        priceType: t.price_type || "REG",
      };
    });
