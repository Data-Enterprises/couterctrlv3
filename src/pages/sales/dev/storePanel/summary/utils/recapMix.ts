import type { SubDeptMargin } from "../../../../../../interfaces";
import type { RecapMix } from "../interfaces/index";

/**
 * A row's type as text. The columns are typed as strings but not every POS
 * sends one: a numeric price type took the whole panel down on `.trim()`.
 */
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

const isRefund = (r: SubDeptMargin) => /^refund/i.test(text(r.sale_type));

/**
 * Regular price or not, by the same rule /sales/topitems uses: REG, or
 * "Regular" (Food Giant's spelling), is regular; any other price type (TPR,
 * SALE, Managers Special…) is a price other than regular. No price type at
 * all is unknown, never regular: Sonic sends none on any row, and calling
 * that regular would report every Sonic item as full price.
 */
const priceKind = (r: SubDeptMargin): "regular" | "promo" | "unknown" => {
  const t = text(r.price_type).toUpperCase();
  if (!t) return "unknown";
  return t === "REG" || t === "REGULAR" ? "regular" : "promo";
};

/**
 * What a day's item rows add to the recap: how many different items sold,
 * its refunds and its price mix.
 *
 * All three need the item rows: the sub dept and hourly figures carry no
 * product code, sale type or price type. The endpoint already signs refunds negative, so
 * a refund's units and money come back below zero and are reported here as
 * the amounts given back.
 *
 * Takes rows already cut to the counted sub depts and to the location.
 */
export const mixForDay = (rows: SubDeptMargin[]): RecapMix => {
  const codes = new Set<string>();
  const mix: RecapMix = {
    items: 0,
    codes: [],
    refunds: { units: 0, net: 0 },
    regular: 0,
    promo: 0,
    unknown: 0,
  };
  for (const r of rows) {
    const net = r.total_sales - r.total_tax;
    if (isRefund(r)) {
      mix.refunds.units += Math.abs(r.qty || 0);
      mix.refunds.net += Math.abs(net);
      continue;
    }
    codes.add(String(r.product_code));
    mix[priceKind(r)] += net;
  }
  mix.codes = [...codes];
  mix.items = codes.size;
  return mix;
};

/**
 * Shares of the day's sales at regular price and on sale, out of the sales
 * whose price type is known. Null when none is known: the mix is "not
 * reported" rather than 100% of anything.
 */
export const priceShares = (mix: RecapMix) => {
  const known = mix.regular + mix.promo;
  if (known <= 0) return null;
  const total = known + Math.max(0, mix.unknown);
  return {
    regular: (mix.regular / known) * 100,
    promo: (mix.promo / known) * 100,
    /** How much of the day's sales had no price type, 0–100. */
    unreported: total > 0 ? (Math.max(0, mix.unknown) / total) * 100 : 0,
  };
};
