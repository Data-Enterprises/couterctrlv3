import { Decimal, sumDecimals } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import { dealAllowances } from "./allowances";
import { sumLineCost } from "./cost";
import type { AwgInvoice } from "./group";
import { lineRetails, sumRetail } from "./retail";

/**
 * An invoice's figures, read one of two ways.
 *
 * **As the file says** — the default. Every line's printed cost and retail,
 * every deal at face value, plus the pallet allowances and delivery charges on
 * their own records. Nothing derived.
 *
 * **With suggested corrections** — once the user applies them. Retail from
 * price × weight and the multi-buy formula (`retail`), cost from the per-pound
 * rate (`cost`), per-pound deals at rate × weight (`allowances`), unbilled
 * lines at zero retail, and each total rounded once. These reproduce how the
 * vendor builds its totals, but they are computed, not read, so they wait to be
 * asked for.
 *
 * Reconciliation and the card both read from here, so the figures above the
 * checks are always the derived side of them.
 */
export interface InvoiceTotals {
  lineItemsCost: Decimal;
  deliveryFees: Decimal;
  palletAllowances: Decimal;
  /** The part of per-pound deals no line took off — rate × weight, less the
   *  rate the line was netted by. Computed, so null until suggested
   *  corrections are applied; see `allowances`. */
  perLbDeals: Decimal | null;
  /** Line items + delivery − pallet allowances, less per-pound deals the
   *  lines did not take off when corrections are applied. */
  totalCost: Decimal;
  totalRetail: Decimal;
  /** Deals plus pallet allowances. */
  totalAllowances: Decimal;
  /** Each line's extended retail, in line order. */
  lineRetails: Decimal[];
}

const money = (value: unknown): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(2);

const sumMoney = (records: ParsedRecord[], field: string): Decimal =>
  sumDecimals(
    records.map((record) => money(record.fields[field])),
    2,
  );

export const invoiceTotals = (invoice: AwgInvoice): InvoiceTotals => {
  const deliveryFees = sumMoney(invoice.deliveryCharges, "cost_ext");
  const palletAllowances = sumMoney(invoice.palletAllowances, "ba_retail_ext");

  if (!invoice.suggested) {
    const lineItemsCost = sumMoney(invoice.lineItems, "cost_ext");
    return {
      lineItemsCost,
      deliveryFees,
      palletAllowances,
      perLbDeals: null,
      totalCost: lineItemsCost.add(deliveryFees).subtract(palletAllowances),
      totalRetail: sumMoney(invoice.lineItems, "ba_retail_ext"),
      totalAllowances: sumMoney(invoice.deals, "deal_amount").add(
        palletAllowances,
      ),
      lineRetails: invoice.lineItems.map((record) =>
        money(record.fields.ba_retail_ext),
      ),
    };
  }

  const lineCost = sumLineCost(invoice.lineItems);
  const deals = dealAllowances(invoice);
  return {
    lineItemsCost: lineCost.divideBy(1n, 2),
    deliveryFees,
    palletAllowances,
    perLbDeals: deals.unnetted.divideBy(1n, 2),
    totalCost: lineCost
      .add(deliveryFees)
      .subtract(palletAllowances)
      .subtract(deals.unnetted)
      .divideBy(1n, 2),
    totalRetail: sumRetail(invoice.lineItems),
    totalAllowances: deals.total.add(palletAllowances).divideBy(1n, 2),
    lineRetails: lineRetails(invoice.lineItems),
  };
};
