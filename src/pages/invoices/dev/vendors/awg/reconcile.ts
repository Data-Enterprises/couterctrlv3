import { Decimal, sumDecimals } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";

/**
 * The correctness gate.
 *
 * Sums derived from the detail records are compared to the vendor's own printed
 * totals on the `19` record, **to the cent**. Nothing else in this tool proves
 * it read the file correctly: field offsets can be off by a column, an
 * overpunch can be misread, a record type can be missed — and every one of
 * those shows up here as a mismatch rather than as a plausible wrong number.
 *
 * It matters more now than it did in the standalone prototype. Output feeds the
 * receiving pipeline, so an invoice that doesn't reconcile is one that would
 * put bad delivery data behind every margin figure downstream. This is the
 * check that should stand between a parse and an upload.
 */
export interface ReconcileCheck {
  label: string;
  derived: Decimal;
  reported: Decimal;
  ok: boolean;
  /** How far apart, for a mismatch worth showing rather than just failing. */
  difference: Decimal;
}

export interface ReconcileResult {
  invoiceNbr: string;
  checks: ReconcileCheck[];
  ok: boolean;
  /** Set when the invoice couldn't be checked at all, rather than failing. */
  note?: string;
}

/** Sums one signed field across records, skipping any that didn't decode to a
 *  Decimal — an absent field is zero, not a reason to abandon the sum. */
const sumField = (
  records: ParsedRecord[],
  field: string,
  decimals: number,
): Decimal =>
  sumDecimals(
    records
      .map((record) => record.fields[field])
      .filter((value): value is Decimal => value instanceof Decimal),
    decimals,
  );

const reported = (value: unknown, decimals: number): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(decimals);

const check = (
  label: string,
  derived: Decimal,
  against: Decimal,
): ReconcileCheck => ({
  label,
  derived,
  reported: against,
  ok: derived.equals(against),
  difference: derived.absoluteDifference(against),
});

export const reconcileInvoice = (invoice: AwgInvoice): ReconcileResult => {
  if (!invoice.total) {
    return {
      invoiceNbr: invoice.invoiceNbr,
      checks: [],
      ok: false,
      note: "no invoice-total record for this invoice",
    };
  }

  const totals = invoice.total.fields;

  const checks: ReconcileCheck[] = [
    // Delivery charges are billed on their own record type but included in the
    // invoice's cost total, so the derived side has to add them or every
    // invoice carrying a delivery fee reports a mismatch.
    check(
      "Total cost (line items + delivery fees)",
      sumField(invoice.lineItems, "cost_ext", 2).add(
        sumField(invoice.deliveryCharges, "cost_ext", 2),
      ),
      reported(totals.cost_ext, 2),
    ),
    check(
      "Extended retail",
      sumField(invoice.lineItems, "ba_retail_ext", 2),
      reported(totals.total_retail, 2),
    ),
    check(
      "Total allowances",
      sumField(invoice.deals, "deal_amount", 2),
      reported(totals.deal_amount, 2),
    ),
    // Whole cases, so scale 0 — comparing this at scale 2 would still be
    // correct arithmetically but would print "24.00 cases".
    check(
      "Total cases",
      sumField(invoice.lineItems, "case_qty_billed", 0),
      reported(totals.case_qty_billed, 0),
    ),
  ];

  return {
    invoiceNbr: invoice.invoiceNbr,
    checks,
    ok: checks.every((entry) => entry.ok),
  };
};

export const reconcileAll = (invoices: AwgInvoice[]): ReconcileResult[] =>
  invoices.map(reconcileInvoice);
