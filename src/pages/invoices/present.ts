import { formatDateSimple } from "../../utils";
import { Decimal, sumDecimals } from "./core/Decimal";
import type { AwgInvoice } from "./vendors/awg";
import type { ReconcileResult } from "./vendors/awg";

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

export interface InvoiceLineRow {
  lineNumber: number;
  upc: string;
  description: string;
  /** Selling units per case — the bridge between a case cost and a unit
   *  retail, without which the two columns look like they should match. */
  pack: string;
  cases: string;
  /** List cost per case. `extCost` is net of allowances, so the two differ by
   *  whatever deal was applied — which is how a deal becomes visible on the
   *  line it affected rather than only in the invoice total. */
  caseCost: string;
  /** Net cost of one selling unit, to the cent — extended cost divided by the
   *  units billed, so it is after allowances and directly comparable to retail.
   *  Null when the line carries no pack or case count to divide by. */
  unitCost: string | null;
  /** Shelf price. Shown as "2/$5.00" where the invoice prices in multiples. */
  retail: string;
  extCost: string;
  extRetail: string;
  /** Null when the line carries no retail, so the panel can show a dash rather
   *  than a misleading 0.0%. */
  marginPct: string | null;
}

export interface InvoiceRow {
  id: string;
  storeNbr: string;
  invoiceNbr: string;
  retailDept: string;
  deliveryDate: string | null;
  lineCount: number;
  totalCost: string;
  totalRetail: string;
  totalAllowances: string;
  totalCases: string;
  reconciled: boolean;
  /** Set when the invoice couldn't be checked at all — no total record. */
  note?: string;
  checks: {
    label: string;
    derived: string;
    reported: string;
    ok: boolean;
    difference: string;
  }[];
  lines: InvoiceLineRow[];
}

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

const presentLines = (invoice: AwgInvoice): InvoiceLineRow[] =>
  invoice.lineItems.map((record, index) => {
    const extCost = money(record.fields.cost_ext);
    const extRetail = money(record.fields.ba_retail_ext);
    const billedUnits =
      count(record.fields.case_qty_billed).units *
      count(record.fields.pack).units;
    return {
      lineNumber: index + 1,
      upc: text(record.fields.upc_code),
      description: text(record.fields.item_desc),
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
    const lineCosts = invoice.lineItems.map((r) => money(r.fields.cost_ext));
    const deliveryCosts = invoice.deliveryCharges.map((r) =>
      money(r.fields.cost_ext),
    );

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
      totalCost: sumDecimals([...lineCosts, ...deliveryCosts], 2).toString(),
      totalRetail: sumDecimals(
        invoice.lineItems.map((r) => money(r.fields.ba_retail_ext)),
        2,
      ).toString(),
      totalAllowances: sumDecimals(
        invoice.deals.map((r) => money(r.fields.deal_amount)),
        2,
      ).toString(),
      totalCases: sumDecimals(
        invoice.lineItems.map((r) => count(r.fields.case_qty_billed)),
        0,
      ).toString(),
      reconciled: result?.ok ?? false,
      note: result?.note,
      checks: (result?.checks ?? []).map((check) => ({
        label: check.label,
        derived: check.derived.toString(),
        reported: check.reported.toString(),
        ok: check.ok,
        difference: check.difference.toString(),
      })),
      lines: presentLines(invoice),
    };
  });
};
