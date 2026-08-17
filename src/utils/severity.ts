export type Severity = "critical" | "watch" | "healthy";

export type SevFilter = "all" | Severity;

export const formatPct = (pct: number) =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

/**
 * Width of a "vs LW" / "vs LY" comparison column — the header label and the
 * pill beneath it both read from this, so the two can never drift apart.
 *
 * `formatPct` renders `[+|-]NN.NN%`, so the width is driven by how many
 * integer digits a swing has. At 13px semibold a character costs roughly
 * 6.6px plus the pill's 12px of horizontal padding, which puts a three-digit
 * move (`+160.88%`) at about 65px — over the 58px these columns used to be
 * pinned to, which is why they spilled outside their own background.
 *
 * Applied as `minWidth` on the pill rather than `width`: the column reserves
 * this much so every row lines up, and a four-digit outlier grows its
 * background instead of clipping it.
 */
export const PCT_COL_W = 72;

/**
 * Slack around a boundary, for comparisons built out of summed line items.
 *
 * Floating point leaves noise on both edges: a genuinely flat department can
 * come out at -0.0000000001%, and 2.20 against 2.00 is 10.000000000000009
 * rather than 10. Neither should tip a grade.
 *
 * This replaces rounding the percentage to 1dp before comparing, which handled
 * the noise but moved the threshold boundary with it — by up to 0.05 points. A
 * department down 9.03% against a 9% threshold rounded to 9.0, failed
 * `< -9`, and graded "watch" while its own pill and its printed -9.03% both
 * said critical. Sub Dept Margins, grading the raw value, called the same
 * department critical.
 *
 * An epsilon is the size of the actual problem. Rounding was three orders of
 * magnitude larger than the noise it was aimed at.
 */
const PCT_EPSILON = 1e-6;

/**
 * The app's grading cut, in one place.
 *
 * Every severity dot, chip count and pill colour resolves through here, so a
 * row cannot be graded one way and coloured another — which is exactly what
 * happened while the dot rounded and the pill did not.
 */
export const gradeSeverity = (pct: number, threshold: number): Severity => {
  if (pct < -threshold - PCT_EPSILON) return "critical";
  if (pct < -PCT_EPSILON) return "watch";
  return "healthy";
};

const PILL_CLASS: Record<Severity, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
};

export const pillClass = (pct: number | null, threshold: number) => {
  if (pct === null) return "bg-gray-100 text-gray-500";
  return PILL_CLASS[gradeSeverity(pct, threshold)];
};

export const CTA_SEVERITY_CLASSES: Record<
  Severity,
  { border: string; bg: string; hoverBg: string; text: string }
> = {
  critical: {
    border: "border-severity_critical_text/25",
    bg: "bg-severity_critical_bg",
    hoverBg: "hover:bg-severity_critical_text/10",
    text: "text-severity_critical_text",
  },
  watch: {
    border: "border-severity_watch_text/25",
    bg: "bg-severity_watch_bg",
    hoverBg: "hover:bg-severity_watch_text/10",
    text: "text-severity_watch_text",
  },
  healthy: {
    border: "border-severity_healthy_text/25",
    bg: "bg-severity_healthy_bg",
    hoverBg: "hover:bg-severity_healthy_text/10",
    text: "text-severity_healthy_text",
  },
};

export const severityDotClass: Record<Severity, string> = {
  critical: "bg-red-500",
  watch: "bg-amber-400",
  healthy: "bg-emerald-500",
};

export const severityHeaderBgClass: Record<Severity, string> = {
  critical: "bg-red-600",
  watch: "bg-amber-500",
  healthy: "bg-emerald-600",
};

export const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
};

export const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
};

export const chipClass = (active: boolean, sev?: Severity) => {
  if (!active)
    return "bg-custom-white border border-gray-200 text-content hover:border-gray-400";
  if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white";
  const m: Record<Severity, string> = {
    critical: "bg-red-600 border-red-600 text-custom-white",
    watch: "bg-amber-500 border-amber-500 text-custom-white",
    healthy: "bg-emerald-600 border-emerald-600 text-custom-white",
  };
  return m[sev];
};
