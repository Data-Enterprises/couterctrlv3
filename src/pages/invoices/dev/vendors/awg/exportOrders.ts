import { rowsToCsv } from "../../../../../utils/csvExport";
import { COST_CORRECTED } from "./cost";
import { RETAIL_CORRECTED } from "./retail";
import {
  ZERO,
  description,
  exportLines,
  four,
  layoutDate,
  productCode,
  text,
  type ExportLine,
} from "./exportLines";
import type { AwgInvoice } from "./group";

/**
 * Invoices in the POS order layout, one row per billed line.
 *
 * An order here is one invoice: `order_id` carries AWG's invoice number,
 * `record_count` its line count, and `order_type` is `INV`, the layout's
 * code for a vendor invoice (`DAM` is damages). `qty` is the cases billed,
 * `casesize` the pack, `base_cost` and `net_cost` per case, and
 * `active_price` the shelf price for `active_qty` units.
 *
 * `extended_plessy` is the layout's short item code, and takes AWG's item
 * code — the one identifier every line has, including random-weight meat
 * that carries no UPC. `scalable` marks those sold by weight.
 *
 * The store's catalogue columns -- category and sub-department -- stay
 * blank; an AWG file knows nothing about them.
 *
 * **`storeid` and `vendor_id` are blank too, and that is the right answer.**
 * Neither is in the file and neither can be asked for honestly:
 *
 *  - A file carries SEVERAL AWG stores. The sample holds ten invoices across
 *    two of them, 5401 and 5789. One store chosen on screen would stamp the
 *    same id on all ten and misattribute four. `storenumber` carries AWG's
 *    own number per invoice, correctly, and the pipeline maps it.
 *  - There is no vendor anywhere in the AWG line schema. The whole file is
 *    AWG, so `vendor_name` goes out as AWG and the pipeline resolves the id.
 *
 * In both cases the file already knows, and a person choosing could only be
 * wrong.
 */

/** An invoice whose delivery date could not be read, so the caller can say so
 *  rather than let a blank `order_date` leave quietly. */
export interface OrdersExport {
  csv: string;
  undatedInvoices: string[];
}

export const ORDER_COLUMNS = [
  "storeid",
  "order_id",
  "order_date",
  "storenumber",
  "storename",
  "status",
  "record_count",
  "order_type",
  "product_code",
  "qty",
  "line_number",
  "tpr",
  "active_price",
  "active_qty",
  "extended_plessy",
  "net_cost",
  "weight",
  "active_retail_qty",
  "description",
  "base_cost",
  "category",
  "category_description",
  "vendor_name",
  "vendor_id",
  "active_retail_price",
  "retail_price",
  "sub_department",
  "sub_department_description",
  "casesize",
  "edited",
  "scalable",
] as const;

type Column = (typeof ORDER_COLUMNS)[number];
type Row = Partial<Record<Column, string | number>>;

const lineRow = (line: ExportLine): Row => {
  const { invoice, record } = line;
  return {
    order_id: invoice.invoiceNbr,
    order_date: layoutDate(invoice.deliveryDate) ?? "",
    storenumber: invoice.storeNbr,
    status: "OPEN",
    record_count: invoice.lineItems.length,
    order_type: "INV",
    product_code: productCode(record.fields.upc_code),
    qty: line.cases.toString(),
    line_number: line.lineNumber,
    tpr: ZERO,
    active_price: four(line.retailPrice),
    active_qty: line.pricingUnit.toString(),
    extended_plessy: text(record.fields.item_code_bil),
    net_cost: four(line.netCaseCost),
    weight: line.randomWeight ? String(record.fields.pallet_weight ?? "") : "",
    active_retail_qty: line.pricingUnit.toString(),
    description: description(record),
    base_cost: four(line.caseCost),
    vendor_name: "AWG",
    active_retail_price: four(line.retailPrice),
    casesize: line.pack.toString(),
    scalable: line.randomWeight ? 1 : 0,
    // The layout has a column for it and the markers are on the record, so a
    // hand-corrected line says so. A SUGGESTED correction does not count: it
    // changes the figure, but nobody typed it, and which reading the file
    // came from is said in the filename instead.
    edited:
      record.fields[COST_CORRECTED] === "Y" ||
      record.fields[RETAIL_CORRECTED] === "Y"
        ? 1
        : 0,
  };
};

export const awgInvoicesToOrdersCsv = (
  invoices: AwgInvoice[],
): OrdersExport => {
  const lines = exportLines(invoices);

  // Named once each, in order, rather than once per line.
  const undated: string[] = [];
  for (const invoice of invoices) {
    if (invoice.lineItems.length === 0) continue;
    if (layoutDate(invoice.deliveryDate) === null) {
      undated.push(invoice.invoiceNbr);
    }
  }

  return {
    csv: rowsToCsv(
      [...ORDER_COLUMNS],
      lines.map((line) => {
        const row = lineRow(line);
        return ORDER_COLUMNS.map((column) => row[column] ?? "");
      }),
    ),
    undatedInvoices: undated,
  };
};
