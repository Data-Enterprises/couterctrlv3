import type { LpSeverity } from "./lpActionsMetrics";

/**
 * Node colour on the connection plot, and anything that has to agree with it.
 *
 * The timeline under the chart is coloured from here rather than from the
 * case charts' series hues: a reader has just clicked a node, and the bars
 * that answer "when did that happen" should be the colour of the thing they
 * clicked, not a second palette for the same four labels.
 */
export const SEV_FILL: Record<LpSeverity, string> = {
  investigate: "rgb(var(--color-severity-critical-text))",
  watch: "rgb(var(--color-severity-watch-text))",
  steady: "rgb(var(--color-severity-healthy-text))",
};

/** Lanes and the unfocused timeline. A lane has no severity of its own — it is
 *  a place, not a behaviour. */
export const NEUTRAL_FILL = "#1e2a4a";
