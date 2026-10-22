import { Decimal, sumDecimals } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";
import { invoiceTotals } from "./totals";

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
  /**
   * `checked` when there is a `19` total to check against. Without one,
   * `nothingBilled` when the invoice carries only `05` exceptions — nothing
   * shipped, so there is nothing to total and nothing wrong — and `noTotal`
   * when it carries billed records the file gives no total for.
   */
  status: "checked" | "noTotal" | "nothingBilled";
  /** Why the invoice could not be checked. */
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
    const billed =
      invoice.lineItems.length +
      invoice.deals.length +
      invoice.palletAllowances.length +
      invoice.deliveryCharges.length +
      invoice.taxes.length +
      invoice.shipperComponents.length;
    if (billed === 0) {
      const n = invoice.exceptions.length;
      return {
        invoiceNbr: invoice.invoiceNbr,
        checks: [],
        ok: true,
        status: "nothingBilled",
        note: `Nothing was billed on this invoice — only ${n} ${
          n === 1 ? "exception" : "exceptions"
        } for items that did not ship, so there is no total to check.`,
      };
    }
    const lines = invoice.lineItems.length;
    return {
      invoiceNbr: invoice.invoiceNbr,
      checks: [],
      ok: false,
      status: "noTotal",
      note: `No total row. This invoice bills ${lines} ${
        lines === 1 ? "line" : "lines"
      }, but the file carries no 19 total record for it, so none of it can be checked against the vendor's figures.`,
    };
  }

  const totals = invoice.total.fields;

  // Pallet allowances and delivery charges come on their own records, and
  // the vendor's total counts both — see `totals`, which also holds the
  // suggested corrections when they are applied.
  const figures = invoiceTotals(invoice);

  const checks: ReconcileCheck[] = [
    check(
      invoice.suggested
        ? "Total cost (line items + delivery fees − pallet allowances − per-lb deals)"
        : "Total cost (line items + delivery fees − pallet allowances)",
      figures.totalCost,
      reported(totals.cost_ext, 2),
    ),
    check(
      "Extended retail",
      figures.totalRetail,
      reported(totals.total_retail, 2),
    ),
    check(
      "Total allowances",
      figures.totalAllowances,
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
    status: "checked",
    ...(unitemized ? { unitemizedAllowance: missing } : {}),
  };
};

export const reconcileAll = (invoices: AwgInvoice[]): ReconcileResult[] =>
  invoices.map(reconcileInvoice);
