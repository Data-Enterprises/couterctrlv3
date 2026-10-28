import { formatDateSimple } from "../../../utils";
import { Decimal, sumDecimals } from "./core/Decimal";
import type { AwgInvoice } from "./vendors/awg";
import type { ReconcileResult } from "./vendors/awg";
import { invoiceTotals } from "./vendors/awg/totals";
import type { InvoiceRow, InvoiceLineRow } from "../../../interfaces";
import type { DiscardedInvoice } from "../../../api/invoices";
// Defined in src/interfaces — Invoices. Re-exported for this page's files.
export type { InvoiceRow, InvoiceLineRow } from "../../../interfaces";

/**
 * Parsed invoices into rows the panels render.
 *
 * Pure, and the only place that turns `Decimal` into a string. Keeping the
 * conversion here means the components never hold a money value they could
 * accidentally do arithmetic on — by the time a figure reaches JSX it is text.
 *
 * Nothing vendor-specific belongs above this file. A second vendor supplies its
 * own `present`, and the panels stay as they are.
 */

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const money = (value: unknown): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(2);

const count = (value: unknown): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(0);

/**
 * Margin from the line's own cost and retail.
 *
 * Computed rather than read off any reported field — the same rule Item Actions
 * settled on. A margin that disagrees with the two numbers printed beside it is
 * worse than no margin at all.
 */
const marginPct = (extCost: Decimal, extRetail: Decimal): string | null => {
  if (extRetail.isZero()) return null;
  // Percent to one place, done in integers: retail and cost are exact, so the
  // ratio should not be handed to floating point until the very last step.
  const scaled = extRetail.subtract(extCost);
  const numerator = Number(scaled.units) * 1000;
  const denominator = Number(extRetail.units);
  if (denominator === 0) return null;
  return `${(numerator / denominator / 10).toFixed(1)}%`;
};

/**
 * The shelf price as the tag reads it.
 *
 * `retail_pricing_unit` is how many units the price covers, so 2 with a $5.00
 * retail is "2 for $5.00" rather than $5.00 each. Printing the bare amount
 * would double the apparent price of every multi-buy on the invoice.
 */
const presentRetail = (price: Decimal, pricingUnit: Decimal): string => {
  const units = pricingUnit.units;
  return units > 1n ? `${units}/$${price.toString()}` : `$${price.toString()}`;
};

/**
 * Cents, like every other money figure on the page.
 *
 * The division itself is exact — extended cost over units billed, in integers —
 * and this is the single rounding step, at the point of printing. Nothing
 * downstream re-uses the rounded value, so the extra places only ever showed a
 * precision the shelf price it sits against doesn't have.
 */
const UNIT_COST_PLACES = 2;

/** A difference with its sign written out, so "+0.05" and "-0.05" read as
 *  which side is higher. */
const signed = (value: Decimal): string =>
  value.isNegative() ? value.toString() : `+${value.toString()}`;

/** Past the vendor's penny rounding — the line between "AWG's arithmetic" and
 *  "something on this invoice is wrong". */
const TEN_CENTS = new Decimal(10n, 2);

const presentLines = (
  invoice: AwgInvoice,
  retails: Decimal[],
): InvoiceLineRow[] =>
  invoice.lineItems.map((record, index) => {
    const extCost = money(record.fields.cost_ext);
    const extRetail = retails[index];
    const billedUnits =
      count(record.fields.case_qty_billed).units *
      count(record.fields.pack).units;
    return {
      lineNumber: index + 1,
      upc: text(record.fields.upc_code),
      description: text(record.fields.item_desc),
      awgCode: text(record.fields.item_code_bil),
      size: text(record.fields.size),
      pack: count(record.fields.pack).toString(),
      cases: count(record.fields.case_qty_billed).toString(),
      caseCost: money(record.fields.mbr_case_cost).toString(),
      unitCost:
        billedUnits === 0n
          ? null
          : extCost.divideBy(billedUnits, UNIT_COST_PLACES).toString(),
      retail: presentRetail(
        money(record.fields.retail_price),
        count(record.fields.retail_pricing_unit),
      ),
      extCost: extCost.toString(),
      extRetail: extRetail.toString(),
      marginPct: marginPct(extCost, extRetail),
    };
  });

export const presentInvoices = (
  invoices: AwgInvoice[],
  reconciliation: ReconcileResult[],
): InvoiceRow[] => {
  const byInvoice = new Map(reconciliation.map((r) => [r.invoiceNbr, r]));

  return invoices.map((invoice) => {
    const result = byInvoice.get(invoice.invoiceNbr);
    // The derived side of the checks, so the figures above them agree.
    const figures = invoiceTotals(invoice);

    return {
      id: `${invoice.storeNbr}-${invoice.invoiceNbr}`,
      storeNbr: invoice.storeNbr,
      invoiceNbr: invoice.invoiceNbr,
      retailDept: invoice.retailDept,
      // ISO through the parser because it sorts and can't be misread; mm/dd/yyyy
      // here because that is what the rest of the app shows.
      deliveryDate: invoice.deliveryDate
        ? formatDateSimple(invoice.deliveryDate)
        : null,
      lineCount: invoice.lineItems.length,
      totalCost: figures.totalCost.toString(),
      totalRetail: figures.totalRetail.toString(),
      totalAllowances: figures.totalAllowances.toString(),
      lineItemsCost: figures.lineItemsCost.toString(),
      deliveryFees: figures.deliveryFees.toString(),
      palletAllowances: figures.palletAllowances.toString(),
      perLbDeals: figures.perLbDeals?.toString() ?? null,
      totalCases: sumDecimals(
        invoice.lineItems.map((r) => count(r.fields.case_qty_billed)),
        0,
      ).toString(),
      reconciled: result?.ok ?? false,
      status: result?.status ?? "checked",
      note: result?.note,
      exceptions: invoice.exceptions.map((record) => ({
        itemCode: text(record.fields.item_code_bil),
        description: text(record.fields.item_desc),
        reason: text(record.fields.excpt_desc),
      })),
      unitemizedAllowance: result?.unitemizedAllowance?.toString() ?? null,
      overTenCents: (result?.checks ?? []).some((check) =>
        check.difference.decimals === 0
          ? !check.difference.isZero()
          : check.difference.compare(TEN_CENTS) > 0,
      ),
      checks: (result?.checks ?? []).map((check) => ({
        id: check.id,
        label: check.label,
        derived: check.derived.toString(),
        reported: check.reported.toString(),
        ok: check.ok,
        difference: check.difference.toString(),
        offBy: signed(check.derived.subtract(check.reported)),
      })),
      // Judged across the lines, not one at a time: a random-weight line's
      // retail depends on the lines beside it — see `vendors/awg/retail`.
      lines: presentLines(invoice, figures.lineRetails),
    };
  });
};

/**
 * Invoices the server would not save, in one line: each by number with the
 * server's own reason, since the reason is what says how to fix it.
 */
export const discardedText = (list: DiscardedInvoice[]): string =>
  list
    .map(
      (d) =>
        `${d.invoiceNumber ? `invoice ${d.invoiceNumber}` : "an invoice with no number"} (${d.error})`,
    )
    .join("; ");
