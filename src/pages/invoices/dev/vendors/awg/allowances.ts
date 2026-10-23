import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";

/**
 * What a deal is worth, and how much of it the lines already took off.
 *
 * A `02` deal on an ordinary line is dollars: `deal_amount` 7.00 is $7.00 off,
 * and the line's `cost_ext` is its gross `mbr_ext_case_cost` less exactly that.
 *
 * A deal on a **random-weight** line (`rwi = "Y"`) is a rate per pound written
 * to four places: the digits `0001000` are $0.1000/lb, not $10.00. What the
 * vendor's total counts is that rate times the line's `pallet_weight` — 28.54
 * lb of ham at $0.10 is 2.854 — but the line itself was netted by the bare
 * rate, 0.10, as if it were a flat deal. Read at face value the deal is a
 * hundred times too big; read as the line was netted it is short by the weight.
 *
 * On the sample both hold without exception: all 45 random-weight deal lines
 * are netted by exactly the rate, and all 21,075 others by exactly the deal.
 *
 * A deal belongs to the line whose `deal_seqnum` it extends: the line carries
 * `000100`, its deals `000101`, `000102`.
 *
 * Kept exact — a millionth of a dollar is fine enough for rate × weight — and
 * rounded once, by the caller, at the total.
 */

const units = (value: unknown): bigint =>
  value instanceof Decimal ? value.units : 0n;

/** The line's sequence for a deal: `000102` → `000100`. */
const lineSeq = (deal: ParsedRecord): string => {
  const seq = String(deal.fields.deal_seqnum ?? "");
  return seq.length === 6 ? `${seq.slice(0, 4)}00` : "";
};

export interface DealAllowances {
  /** Every deal at what the vendor's total counts it as. */
  total: Decimal;
  /** The part of that no line took off: rate × weight, less the rate. */
  unnetted: Decimal;
}

export const dealAllowances = (invoice: AwgInvoice): DealAllowances => {
  const bySeq = new Map<string, ParsedRecord>();
  for (const line of invoice.lineItems) {
    bySeq.set(String(line.fields.deal_seqnum ?? ""), line);
  }

  let total = Decimal.zero(6);
  let unnetted = Decimal.zero(6);
  for (const deal of invoice.deals) {
    const amount = units(deal.fields.deal_amount);
    const line = bySeq.get(lineSeq(deal));
    if (line?.fields.rwi === "Y") {
      // Rate at four places × weight at two: millionths of a dollar.
      const byWeight = new Decimal(
        amount * units(line.fields.pallet_weight),
        6,
      );
      // The line was netted by the rate read as dollars and cents.
      const netted = new Decimal(amount, 4);
      total = total.add(byWeight);
      unnetted = unnetted.add(byWeight.subtract(netted));
    } else {
      total = total.add(new Decimal(amount, 2));
    }
  }
  return { total, unnetted };
};
