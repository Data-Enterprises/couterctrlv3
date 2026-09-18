import { formatBigNumber } from ".";

/**
 * The unit an item is actually priced and costed in.
 *
 * A scale item's `qty` is a scan count — how many times it was rung — while
 * `weight` is what the shelf price and the invoice cost are denominated in.
 * `calculateCogs` already follows this rule (`weight` wins whenever it is
 * non-zero); this is the same rule for everything that has to *display* the
 * figure, so a reader can multiply the cost beside it and land on the COGS.
 *
 * Showing `qty` instead is not a rounding difference. BNLS CHICKEN THIGHS rang
 * 160 packages weighing 506.03 lb in a week, so it costed at $1.36 x 506.03 =
 * $688.19, where the visible columns implied $217.60 and a 78% margin on
 * chicken.
 *
 * It also matters for movement, not just cost: pounds per ring moves as much as
 * 89% day to day inside a single item (BNLS CHICKEN BREAST ran 0.94–1.77 lb),
 * so a ring count is a poor stand-in for volume on a variable-weight
 * department.
 *
 * Lives here rather than beside either caller because the Cost grid and the
 * item report both need it and had already begun to disagree — the Cost tab
 * read 506.03 lb for an item the Items tab called 160.
 */
export const pricedUnits = (qty: number, weight: number | undefined | null) =>
  (weight ?? 0) > 0 ? weight! : qty;

/** The same rule for a whole row, for callers holding rows rather than the two
 *  figures — Item Report sums it across a sub department's rows. */
export const rowPricedUnits = (r: { qty: number; weight?: number | null }) =>
  pricedUnits(r.qty, r.weight);

/** True when the figure is pounds rather than a count — callers that label or
 *  total the column need to know which they are holding. */
export const isWeighted = (weight: number | undefined | null) =>
  (weight ?? 0) > 0;

/**
 * The figure with its unit attached.
 *
 * Pounds keep two decimals and carry "lb"; a ring count never has a fraction
 * and is left bare. The unit is not decoration — without it the column silently
 * changes meaning between rows.
 */
export const formatPricedUnits = (
  qty: number,
  weight: number | undefined | null,
) =>
  isWeighted(weight)
    ? `${weight!.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} lb`
    : formatBigNumber(qty, 0);

/**
 * The figure with no unit attached, for a cell too narrow to carry one.
 *
 * The day strip pairs this with a dollar figure inside an 92px column, where
 * " lb" is the difference between one line and two — and a value that wraps
 * between its number and its unit is worse than no unit at all. The decimals
 * still mark it as pounds, and the row directly above it in the panel spells
 * the unit out in full.
 */
export const formatPricedUnitsShort = (
  qty: number,
  weight: number | undefined | null,
) =>
  isWeighted(weight)
    ? weight!.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : formatBigNumber(qty, 0);

/** The unit the figure is denominated in, for copy that has to name a rate —
 *  "$1.36/lb" reads as a cost, "$1.36" alone reads as a package price. */
export const pricedUnitLabel = (weight: number | undefined | null) =>
  isWeighted(weight) ? "lb" : "ea";

/** Column header for a grid whose quantity column follows this rule. Both units
 *  are named because a mixed sub department shows both, row to row. */
export const PRICED_UNITS_LABEL = "Qty / Lb";
