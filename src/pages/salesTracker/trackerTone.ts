/**
 * Colour on the sign of a change, the way the legacy tracker did it.
 *
 * There is no threshold and no severity here: a department is up or it is down,
 * and the page does not rank how badly. That is the whole point of the tracker
 * as against the graded Performance pages — it reports movement, it does not
 * triage it.
 *
 * `null` means there was nothing to compare against, which is not the same as
 * no change and must not read as neutral-good.
 */
export const changeTone = (v: number | null) => {
  if (v === null) return "text-content";
  if (v > 0) return "text-severity_healthy_text";
  if (v < 0) return "text-severity_critical_text";
  return "text-content";
};

/**
 * The filled pill the Performance rows use for a delta.
 *
 * Exactly one figure per row wears this. It is the anchor the eye lands on
 * first, so giving it to two columns at once — which is where this page
 * started — leaves the row with no reading order at all.
 *
 * A missing comparison gets the neutral fill rather than no pill, so the column
 * keeps its shape down the list instead of gapping.
 */
export const changePill = (v: number | null) => {
  if (v === null) return "bg-gray-100 text-content";
  if (v > 0) return "bg-severity_healthy_bg text-severity_healthy_text";
  if (v < 0) return "bg-severity_critical_bg text-severity_critical_text";
  return "bg-gray-100 text-content";
};

/** Dollar changes carry an explicit sign; the formatter only supplies the
 *  minus, so a gain needs its plus adding. */
export const signed = (v: number | null, fmt: (n: number) => string) =>
  v === null ? "—" : `${v > 0 ? "+" : v < 0 ? "-" : ""}${fmt(Math.abs(v))}`;

export const signedPct = (v: number | null) =>
  v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

/**
 * An unsigned figure that may not exist.
 *
 * ATS is the case: a day with no transactions has no average transaction, and
 * rendering `$0.00` asserts one — a claim the reader cannot tell apart from a
 * real average that happened to be nothing.
 */
export const orDash = (v: number | null, fmt: (n: number) => string) =>
  v === null ? "—" : fmt(v);
