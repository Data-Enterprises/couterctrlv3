import { Decimal, DecimalError } from "../../invoices/dev/core/Decimal";
import {
  ZERO,
  four,
  layoutDate,
} from "../../invoices/dev/vendors/awg/exportLines";
import { ORDER_COLUMNS } from "../../invoices/dev/vendors/awg/exportOrders";
import { rowsToCsv } from "../../../utils/csvExport";
import type { InvoiceLine, ParsedInvoice } from "../../../api/invoices";

/**
 * Scanned invoices in the two POS layouts, one row per line item.
 *
 * Same layouts as the AWG page's exports, and the same money format (four
 * places) and date format, so a file from either page imports the same way.
 * What differs is how much a scan knows. An OCR read records cost only — the
 * prompt forbids retail — and has no pack size, catalogue ids or vendor id,
 * so those columns are left blank rather than guessed. A blank is a column
 * the POS fills in on import; a guess is a wrong number nobody looks at.
 *
 * Figures are transcribed as printed and stay strings from the server to the
 * file. Nothing passes through a float: a line that balanced on the server
 * must not arrive a cent out here.
 */

/** The POS invoice layout, column for column as the POS exports it. */
export const INVOICE_COLUMNS = [
  "storeid",
  "store_name",
  "invoiceid",
  "vendorid",
  "order_date",
  "po_number",
  "invoice_date",
  "vendor_name",
  "contact",
  "starttime",
  "endtime",
  "store_number",
  "terminal",
  "status",
  "item_count",
  "cashier_number",
  "cashier_name",
  "customerid",
  "reference_number",
  "invoice_note",
  "shipping_note",
  "product_code",
  "department",
  "subdepartment",
  "subdepartment_description",
  "department_description",
  "category",
  "category_description",
  "case_size",
  "plessey_code",
  "base_cost",
  "qty",
  "total_dollars",
  "weight",
  "unit_qty",
  "case_on_order",
  "allowance_qualifier",
  "allowance_amount",
  "allowance_percent",
  "allowance_start_date",
  "allowance_end_date",
  "allowance_code",
  "allowance_number",
  "allowance_off_invoice",
  "allowance_max_qty",
  "allowance_min_qty",
  "allowance_total",
  "cost_break_qualifier",
  "cost_break_amount",
  "cost_break_percent",
  "cost_break_start_date",
  "cost_break_end_date",
  "cost_break_off_invoice",
  "cost_break_min_qty",
  "cost_break_max_qty",
  "cost_break_total",
  "discount_qualifier",
  "discount_amount",
  "discount_percent",
  "discount_start_date",
  "discount_end_date",
  "discount_number",
  "discount_off_invoice",
  "discount_max_qty",
  "discount_min_qty",
  "event_regular_discount",
  "rebate_qualifier",
  "rebate_amount",
  "rebate_start_date",
  "rebate_end_date",
  "rebate_number",
  "rebate_percent",
  "rebate_off_invoice",
  "rebate_total",
  "rebate_min_qty",
  "rebate_max_qty",
  "event_promo_discount",
  "event_promo_type",
  "event_promo_date",
  "event_regular_type",
  "weight_net",
  "freight_case_weight",
  "freight_case_cube",
  "case_quantity",
  "product_description",
  "split_item_code",
  "registration_mode",
  "void_flag",
  "refund_key_flag",
  "tentative_flag",
  "line_number",
  "cost_fee_amount",
  "cost_fee_percent",
  "unit_net_cost",
  "buying_format",
  "delivery_date",
  "free_flat",
  "item_return_flag",
  "unit_on_order",
  "weight_on_order",
  "envir_fees_value",
  "envir_fees_tlz",
  "billback1_amount",
  "billback1_percent",
  "billback2_amount",
  "billback2_percent",
  "billback3_amount",
  "billback3_percent",
  "billback4_descriptor",
  "billback4_amount",
  "billback4_percent",
  "billback1_total",
  "billback2_total",
  "billback3_total",
  "billback4_total",
  "event_regular_days",
  "back_order_days",
  "back_order_filled",
  "retail_total",
  "cost_Fee_amount_total",
  "cost_fee_percent_total",
  "total_match_up_down",
  "retail_price",
  "cost_method",
  "split_item_qty",
  "cost_comment",
  "fee1",
  "fee2",
  "fee3",
  "fee4",
  "fee5",
  "fee6",
  "fee7",
  "fee8",
  "fee9",
  "fee10",
  "gross_purchase",
  "default_quantity",
  "store_city",
  "store_state",
  "store_zipcode",
  "store_phone",
  "store_address",
  "internal_id",
] as const;

type InvoiceColumn = (typeof INVOICE_COLUMNS)[number];
type OrderColumn = (typeof ORDER_COLUMNS)[number];
type Row<C extends string> = Partial<Record<C, string | number>>;

const PLACES = 4;

/**
 * A printed amount, or null when it is not one.
 *
 * The prompt asks for a leading "-", but a scan is a scan: a parenthesised or
 * trailing-minus figure, a "$" or a thousands separator are read too, the way
 * the server's own `_d` reads them. Anything else is a blank cell, not a zero
 * — a zero would be a figure on no invoice.
 */
export const amount = (value: string | null | undefined): Decimal | null => {
  if (value === null || value === undefined) return null;
  let s = String(value).replace(/[$,\s]/g, "");
  if (s === "") return null;
  if (/^\(.*\)$/.test(s)) s = "-" + s.slice(1, -1);
  else if (s.endsWith("-")) s = "-" + s.slice(0, -1);
  try {
    return Decimal.parse(s, PLACES);
  } catch (e) {
    if (e instanceof DecimalError) return null;
    throw e;
  }
};

/** The line's quantity as an exact decimal. A scan can bill half a case. */
const quantity = (qty: number): Decimal | null =>
  Number.isFinite(qty) ? amount(qty.toFixed(PLACES)) : null;

/** Money times a quantity, to four places. */
const times = (money: Decimal, qty: Decimal): Decimal =>
  new Decimal(money.units * qty.units, money.decimals + qty.decimals).divideBy(
    1n,
    PLACES,
  );

/** Money over a quantity, to four places. */
const over = (money: Decimal, qty: Decimal): Decimal =>
  new Decimal(
    money.units * 10n ** BigInt(qty.decimals),
    money.decimals,
  ).divideBy(qty.units, PLACES);

const fmt = (value: Decimal | null): string => (value ? four(value) : "");

/** A GS1 mod-10 check on the last digit — UPC-A and EAN-13 alike. */
const checkDigitOk = (digits: string): boolean => {
  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    const d = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
};

/**
 * The 13-digit code the layouts use: no check digit, zero-padded.
 *
 * `028400589271` → `0002840058927`. Invoices print UPCs both with and without
 * their check digit, so it is only dropped from a 12- or 13-digit code whose
 * last digit actually checks; a 10- or 11-digit code is already without one.
 * A 12-digit code printed without its check digit that happens to validate
 * anyway (one in ten) is the case this cannot tell apart — the item will not
 * match on import, which is visible, rather than matching the wrong item.
 *
 * All zeros, or no digits at all, is no UPC and is left blank.
 */
export const posProductCode = (upc: string | null | undefined): string => {
  const digits = (upc ?? "").replace(/\D/g, "");
  if (/^0*$/.test(digits)) return "";
  const body =
    (digits.length === 12 || digits.length === 13) && checkDigitOk(digits)
      ? digits.slice(0, -1)
      : digits;
  return body.length <= 13 ? body.padStart(13, "0") : body;
};

/** One line's figures, worked out once for both layouts. */
const figures = (line: InvoiceLine) => {
  const qty = quantity(line.qty);
  const unitPrice = amount(line.unitPrice);
  const allowance = amount(line.allowance);
  const ext = amount(line.ext);
  const gross = unitPrice && qty ? times(unitPrice, qty) : null;
  // What the store pays per unit, from what was billed: the extended amount
  // over the quantity. A zero-quantity line has no such figure, so it falls
  // back to the printed price less the line's allowance.
  const net =
    ext && qty && !qty.isZero()
      ? over(ext, qty)
      : unitPrice
        ? unitPrice.subtract(allowance ?? Decimal.zero(PLACES))
        : null;
  return {
    qty,
    unitPrice,
    allowance,
    ext,
    gross,
    net,
    allowanceTotal: allowance && qty ? times(allowance, qty) : null,
  };
};

const qtyText = (line: InvoiceLine): string =>
  Number.isFinite(line.qty) ? String(line.qty) : "";

const invoiceRow = (
  storeid: number,
  invoice: ParsedInvoice,
  line: InvoiceLine,
  index: number,
): Row<InvoiceColumn> => {
  const f = figures(line);
  const date = layoutDate(invoice.invoiceDate);
  return {
    storeid,
    store_name: invoice.storeName ?? "",
    // The POS's own id goes in `invoiceid`, and the vendor's invoice number
    // in `reference_number` — which is how the POS's export reads.
    reference_number: invoice.invoiceNumber,
    invoice_date: date,
    delivery_date: date,
    vendor_name: invoice.vendor ?? "",
    store_number: invoice.storeNumber ?? "",
    status: "OPEN",
    item_count: invoice.lines.length,
    product_code: posProductCode(line.upc),
    base_cost: fmt(f.unitPrice),
    qty: qtyText(line),
    unit_qty: qtyText(line),
    total_dollars: fmt(f.ext),
    case_on_order: 0,
    allowance_amount: fmt(f.allowance),
    allowance_off_invoice: f.allowance ? 1 : "",
    allowance_total: f.allowanceTotal ? four(f.allowanceTotal) : ZERO,
    cost_break_total: ZERO,
    rebate_total: ZERO,
    case_quantity: 0,
    product_description: line.description ?? "",
    registration_mode: "ITEM",
    void_flag: 0,
    line_number: index + 1,
    unit_net_cost: fmt(f.net),
    free_flat: 0,
    unit_on_order: 0,
    billback1_total: ZERO,
    billback2_total: ZERO,
    billback3_total: ZERO,
    billback4_total: ZERO,
    cost_Fee_amount_total: ZERO,
    cost_fee_percent_total: ZERO,
    total_match_up_down: ZERO,
    split_item_qty: 0,
    gross_purchase: fmt(f.gross),
  };
};

const orderRow = (
  storeid: number,
  invoice: ParsedInvoice,
  line: InvoiceLine,
  index: number,
): Row<OrderColumn> => {
  const f = figures(line);
  return {
    storeid,
    // An order here is one invoice, as on the AWG export.
    order_id: invoice.invoiceNumber,
    order_date: layoutDate(invoice.invoiceDate),
    storenumber: invoice.storeNumber ?? "",
    storename: invoice.storeName ?? "",
    status: "OPEN",
    record_count: invoice.lines.length,
    order_type: "INV",
    product_code: posProductCode(line.upc),
    qty: qtyText(line),
    line_number: index + 1,
    tpr: ZERO,
    // The vendor's item code, the one identifier a line without a UPC has.
    extended_plessy: line.itemCode ?? "",
    net_cost: fmt(f.net),
    description: line.description ?? "",
    base_cost: fmt(f.unitPrice),
    vendor_name: invoice.vendor ?? "",
  };
};

const toCsv = <C extends string>(
  columns: readonly C[],
  storeid: number,
  invoices: ParsedInvoice[],
  build: (
    storeid: number,
    invoice: ParsedInvoice,
    line: InvoiceLine,
    index: number,
  ) => Row<C>,
): string =>
  rowsToCsv(
    [...columns],
    invoices.flatMap((invoice) =>
      invoice.lines.map((line, index) => {
        const row = build(storeid, invoice, line, index);
        return columns.map((column) => row[column] ?? "");
      }),
    ),
  );

export const scannedToInvoicesCsv = (
  storeid: number,
  invoices: ParsedInvoice[],
): string => toCsv(INVOICE_COLUMNS, storeid, invoices, invoiceRow);

export const scannedToOrdersCsv = (
  storeid: number,
  invoices: ParsedInvoice[],
): string => toCsv(ORDER_COLUMNS, storeid, invoices, orderRow);
