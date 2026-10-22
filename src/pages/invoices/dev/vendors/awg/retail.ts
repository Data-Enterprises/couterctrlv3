import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";

/**
 * A billed line's extended retail, and an invoice's.
 *
 * The `ba_retail_ext` column as printed, except where the vendor's own totals
 * show it computes the figure rather than reading it back:
 *
 * **Multi-buy** — "3 for $10.00", `retail_pricing_unit` above 1. The column is
 * the rounded unit price times the units (6 × 3.33 = 19.98) but the invoice
 * total is built from the exact figure (6 × 10.00 / 3 = 20.00). Read as
 *
 *     retail_price × pack / retail_pricing_unit × case_qty_billed
 *
 * and kept as an exact fraction, so the invoice total rounds once. On the
 * sample that closes the penny gap on 90 invoices and opens it on none.
 *
 * **Random weight** — `rwi = "Y"`, priced by the pound. Read as
 *
 *     retail_price × pack / retail_pricing_unit × case_qty_billed × pallet_weight
 *
 * rounded to the cent on each line. The column truncates instead (8.49 ×
 * 10.18 lb = 86.4282 prints 86.42), and repeats a run's total across the run.
 * But the weight is only sometimes the real catch weight — deli loaves carry
 * 10.18 lb, ground-beef cases a placeholder 80.00 — so the formula is used
 * only where it agrees with the column: lines showing the same figure, taken
 * together, must come within a cent a line of it. Where they don't, the
 * column stands and Split retail is what fixes a repeated run.
 *
 * **Unbilled lines** — no price and no cost, like the HARPS XDOCK PALLET
 * line that carries the pallets a cross-dock order shipped on. Its column
 * holds a figure (8 pallets, 8.00) but nothing is being sold, and the
 * vendor's retail total leaves it out. Counted as zero.
 *
 * Quantities are what was billed, not ordered: on a shorted line — ten
 * ordered, six shipped — the order quantity would price cases that never came.
 *
 * Everywhere else the column stands, because there the formula is worse:
 * single-unit prices are rounded to the cent in `retail_price` (portion ketchup
 * at 0.04 × 200 = 8.00 against a true 8.96), and a zero price means only the
 * column carries the retail. A retail corrected by hand stands too — it is
 * what the user said the line is.
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

const column = (record: ParsedRecord): Cents => ({
  num: units(record.fields.ba_retail_ext),
  den: 1n,
});

const corrected = (record: ParsedRecord): boolean =>
  record.fields[RETAIL_CORRECTED] === "Y";

const randomWeight = (record: ParsedRecord): boolean =>
  record.fields.rwi === "Y" && !corrected(record);

const unbilled = (record: ParsedRecord): boolean =>
  !corrected(record) &&
  units(record.fields.retail_price) === 0n &&
  units(record.fields.cost_ext) === 0n;

const isMultiBuy = (record: ParsedRecord): boolean =>
  record.fields.rwi !== "Y" &&
  !corrected(record) &&
  units(record.fields.retail_price) > 0n &&
  units(record.fields.retail_pricing_unit) > 1n;

const multiBuyCents = (record: ParsedRecord): Cents => ({
  num:
    units(record.fields.retail_price) *
    units(record.fields.pack) *
    units(record.fields.case_qty_billed),
  den: units(record.fields.retail_pricing_unit),
});

/** Half-up to whole cents. */
const roundCents = ({ num, den }: Cents): bigint =>
  num >= 0n ? (2n * num + den) / (2n * den) : -((2n * -num + den) / (2n * den));

/** Price × pack / pricing unit × quantity × weight, to the cent. Weight is in
 *  hundredths of a pound, hence the extra hundred. A zero pricing unit is
 *  read as one, as it is for every other price on the file. */
const randomWeightCents = (record: ParsedRecord): bigint =>
  roundCents({
    num:
      units(record.fields.retail_price) *
      units(record.fields.pack) *
      units(record.fields.case_qty_billed) *
      units(record.fields.pallet_weight),
    den: (units(record.fields.retail_pricing_unit) || 1n) * 100n,
  });

const figureKey = (record: ParsedRecord): string =>
  [
    record.fields.item_code_bil,
    record.fields.retail_price,
    record.fields.ba_retail_ext,
  ]
    .map((value) => String(value ?? ""))
    .join("\0");

/**
 * Every line's extended retail, as an exact fraction of a cent.
 *
 * Random-weight lines are judged in runs of consecutive lines showing the same
 * figure: a line on its own, or a run not yet split. The formula replaces the
 * run's column only when its lines add up to within a cent a line of the
 * figure — near enough that the weights are real and the difference is the
 * column's truncation.
 */
const lineCents = (records: ParsedRecord[]): Cents[] => {
  const out: Cents[] = records.map((record) =>
    unbilled(record)
      ? { num: 0n, den: 1n }
      : isMultiBuy(record)
        ? multiBuyCents(record)
        : column(record),
  );

  let start = 0;
  while (start < records.length) {
    if (!randomWeight(records[start])) {
      start += 1;
      continue;
    }
    const key = figureKey(records[start]);
    let end = start + 1;
    while (
      end < records.length &&
      randomWeight(records[end]) &&
      figureKey(records[end]) === key
    ) {
      end += 1;
    }

    const formula = records.slice(start, end).map(randomWeightCents);
    const figure = units(records[start].fields.ba_retail_ext);
    const sum = formula.reduce((a, b) => a + b, 0n);
    const gap = sum > figure ? sum - figure : figure - sum;
    if (gap <= BigInt(end - start)) {
      formula.forEach((cents, at) => {
        out[start + at] = { num: cents, den: 1n };
      });
    }
    start = end;
  }
  return out;
};

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

const toDecimal = ({ num, den }: Cents): Decimal =>
  new Decimal(num, 2).divideBy(den, 2);

/** Each line's extended retail, to the cent, in the order given. */
export const lineRetails = (records: ParsedRecord[]): Decimal[] =>
  lineCents(records).map(toDecimal);

/** The lines' extended retail together, exact until the single rounding. */
export const sumRetail = (records: ParsedRecord[]): Decimal => {
  let total: Cents = { num: 0n, den: 1n };
  for (const line of lineCents(records)) {
    const den = (total.den / gcd(total.den, line.den)) * line.den;
    total = {
      num: total.num * (den / total.den) + line.num * (den / line.den),
      den,
    };
  }
  return toDecimal(total);
};
