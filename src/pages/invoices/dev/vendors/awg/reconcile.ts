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
  /**
   * Allowance the `19` total nets that no detail record carries.
   *
   * Set only when the cost and allowance checks both miss by this same amount,
   * which is the signature of it: meat invoices carry flat allowances of a few
   * dollars on the total alone. It is reported, not added in — the file gives
   * no record of it, so counting it would pass the invoice on nothing but its
   * own total.
   */
  unitemizedAllowance?: Decimal;
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

  // Pallet allowances come on their own `03` records and are not netted into
  // any line, but the vendor's total counts them in both its cost and its
  // allowances. Left out, every invoice with one fails both checks by exactly
  // its amount.
  const palletAllowances = sumField(
    invoice.palletAllowances,
    "ba_retail_ext",
    2,
  );

  const checks: ReconcileCheck[] = [
    // Delivery charges are billed on their own record type but included in the
    // invoice's cost total, so the derived side has to add them or every
    // invoice carrying a delivery fee reports a mismatch.
    check(
      "Total cost (line items + delivery fees − pallet allowances)",
      sumField(invoice.lineItems, "cost_ext", 2)
        .add(sumField(invoice.deliveryCharges, "cost_ext", 2))
        .subtract(palletAllowances),
      reported(totals.cost_ext, 2),
    ),
    check(
      "Extended retail",
      sumField(invoice.lineItems, "ba_retail_ext", 2),
      reported(totals.total_retail, 2),
    ),
    check(
      "Total allowances",
      sumField(invoice.deals, "deal_amount", 2).add(palletAllowances),
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

  const [cost, , allowances] = checks;
  const missing = allowances.reported.subtract(allowances.derived);
  const unitemized =
    !cost.ok &&
    !allowances.ok &&
    missing.units > 0n &&
    cost.derived.subtract(cost.reported).equals(missing);

  return {
    invoiceNbr: invoice.invoiceNbr,
    checks,
    ok: checks.every((entry) => entry.ok),
    ...(unitemized ? { unitemizedAllowance: missing } : {}),
  };
};

export const reconcileAll = (invoices: AwgInvoice[]): ReconcileResult[] =>
  invoices.map(reconcileInvoice);
