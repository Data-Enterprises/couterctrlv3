import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";

/**
 * A billed line's extended retail, and an invoice's.
 *
 * Mostly the `ba_retail_ext` column as printed. The exception is multi-buy
 * pricing — "3 for $10.00", `retail_pricing_unit` above 1 — where the column
 * is the rounded unit price times the units (6 × 3.33 = 19.98) but the
 * vendor's invoice total is built from the exact figure (6 × 10.00 / 3 =
 * 20.00). Those lines are read as
 *
 *     retail_price × pack / retail_pricing_unit × order_qty
 *
 * and kept as an exact fraction, so the invoice total rounds once, at the end.
 * On the sample that closes the penny gap on 90 invoices and opens it on none.
 *
 * Everywhere else the column stands, because there the formula is worse:
 * single-unit prices are rounded to the cent in `retail_price` (portion ketchup
 * at 0.04 × 200 = 8.00 against a true 8.96), random-weight lines price by the
 * pound, and a zero price means only the column carries the retail. A retail
 * corrected by hand stands too — it is what the user said the line is.
 */

/** Set by a hand correction of `ba_retail_ext`, so the column is used as typed. */
export const RETAIL_CORRECTED = "retail_corrected";

/** Cents, as numerator over denominator. */
interface Cents {
  num: bigint;
  den: bigint;
}

const units = (value: unknown): bigint =>
  value instanceof Decimal ? value.units : 0n;

const isMultiBuy = (record: ParsedRecord): boolean =>
  record.fields.rwi !== "Y" &&
  record.fields[RETAIL_CORRECTED] !== "Y" &&
  units(record.fields.retail_price) > 0n &&
  units(record.fields.retail_pricing_unit) > 1n;

const lineCents = (record: ParsedRecord): Cents =>
  isMultiBuy(record)
    ? {
        num:
          units(record.fields.retail_price) *
          units(record.fields.pack) *
          units(record.fields.order_qty),
        den: units(record.fields.retail_pricing_unit),
      }
    : { num: units(record.fields.ba_retail_ext), den: 1n };

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

const toDecimal = ({ num, den }: Cents): Decimal =>
  new Decimal(num, 2).divideBy(den, 2);

/** One line's extended retail, to the cent. */
export const lineRetail = (record: ParsedRecord): Decimal =>
  toDecimal(lineCents(record));

/** The lines' extended retail together, exact until the single rounding. */
export const sumRetail = (records: ParsedRecord[]): Decimal => {
  let total: Cents = { num: 0n, den: 1n };
  for (const record of records) {
    const line = lineCents(record);
    const den = (total.den / gcd(total.den, line.den)) * line.den;
    total = {
      num: total.num * (den / total.den) + line.num * (den / line.den),
      den,
    };
  }
  return toDecimal(total);
};
