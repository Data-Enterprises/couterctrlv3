/**
 * Colour on the sign of a change: up or down, no threshold or severity.
 * `null` means nothing to compare against, which must not read as good.
 */
export const changeTone = (v: number | null) => {
  if (v === null) return "text-content";
  if (v > 0) return "text-severity_healthy_text";
  if (v < 0) return "text-severity_critical_text";
  return "text-content";
};

/**
 * The filled pill for a delta: exactly one figure per row wears it. A missing
 * comparison gets the neutral fill, so the column keeps its shape.
 */
export const changePill = (v: number | null) => {
  if (v === null) return "bg-fill_muted text-content";
  if (v > 0) return "bg-severity_healthy_bg text-severity_healthy_text";
  if (v < 0) return "bg-severity_critical_bg text-severity_critical_text";
  return "bg-fill_muted text-content";
};

/** Dollar changes carry an explicit sign; the formatter only supplies the
 *  minus, so a gain needs its plus adding. */
export const signed = (v: number | null, fmt: (n: number) => string) =>
  v === null ? "—" : `${v > 0 ? "+" : v < 0 ? "-" : ""}${fmt(Math.abs(v))}`;

export const signedPct = (v: number | null) =>
  v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

/**
 * An unsigned figure that may not exist (ATS: no transactions means no average,
 * not `$0.00`).
 */
export const orDash = (v: number | null, fmt: (n: number) => string) =>
  v === null ? "—" : fmt(v);
