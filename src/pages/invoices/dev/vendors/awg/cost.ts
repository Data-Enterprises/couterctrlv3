import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";

/**
 * The billed lines' extended cost, as the vendor's total adds it up.
 *
 * Each line's `cost_ext` is rounded to the cent, but on random-weight product
 * the invoice total is built from the unrounded figure: cost per pound times
 * weight. A pork butt at $0.85/lb × 76.19 lb is 64.7615, printed 64.76; fifty
 * of them add up to a total a few cents off the printed lines. Meat invoices
 * miss this way on 53 of 62 in the sample.
 *
 * The rate is not in the file, so it is worked back from the line: cost over
 * weight, to the cent per pound. It is only trusted when rate × weight rounds
 * back to the printed cost — then the line is counted at rate × weight,
 * unrounded. Otherwise, or on a line whose cost was corrected by hand, the
 * printed cost stands. On the sample this reconciles the cost on 82 more
 * invoices and costs three a cent each, where the true rate was finer than
 * a cent per pound.
 */

/** Set by a hand correction of `cost_ext`, so the line is counted as typed. */
export const COST_CORRECTED = "cost_corrected";

const units = (value: unknown): bigint =>
  value instanceof Decimal ? value.units : 0n;

/** Rate × weight in ten-thousandths of a dollar, or null when the line is not
 *  costed by the pound or the rate cannot be recovered. */
const byWeight = (record: ParsedRecord): bigint | null => {
  if (record.fields.rwi !== "Y" || record.fields[COST_CORRECTED] === "Y") {
    return null;
  }
  const cost = units(record.fields.cost_ext);
  const weight = units(record.fields.pallet_weight);
  if (weight <= 0n || cost <= 0n) return null;

  // Cents per pound, half-up: cost (cents) × 100 / weight (hundredths of a lb).
  const rate = (2n * cost * 100n + weight) / (2n * weight);
  const exact = rate * weight;
  return (2n * exact + 100n) / 200n === cost ? exact : null;
};

/** The lines' cost together, unrounded — four places, for the caller to
 *  round once at the total. */
export const sumLineCost = (records: ParsedRecord[]): Decimal => {
  let total = 0n;
  for (const record of records) {
    total += byWeight(record) ?? units(record.fields.cost_ext) * 100n;
  }
  return new Decimal(total, 4);
};
