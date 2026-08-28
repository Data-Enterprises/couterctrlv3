import type { LpSeverity } from "../lpActionsMetrics";

/**
 * Severity, dressed. One place so the dot, the number and the bar can never
 * disagree about how alarming a row is.
 *
 * These are LP Actions' existing classes, lifted out of `LpExceptionList`
 * rather than restyled — re-rooting the list on the cashier is not a licence
 * to change what the colours mean while nobody is looking.
 */
export const DOT: Record<LpSeverity, string> = {
  investigate: "bg-severity_critical_text",
  watch: "bg-severity_watch_text",
  steady: "bg-severity_healthy_text",
};

/** The multiple, and any other number graded by the same rule. `steady` stays
 *  neutral: a calm row should read as calm, not as a third colour competing
 *  with the two that mean something. */
export const VALUE_TEXT: Record<LpSeverity, string> = {
  investigate: "text-severity_critical_text",
  watch: "text-severity_watch_text",
  steady: "text-content/85",
};

/** The most recent bar in a week strip. Earlier weeks stay grey — three grey
 *  bars and a coloured one is a spike, four level bars is a habit. */
export const BAR: Record<LpSeverity, string> = {
  investigate: "bg-severity_critical_text",
  watch: "bg-severity_watch_text",
  steady: "bg-severity_healthy_text",
};

/**
 * `2.7×`, or the honest absence of one.
 *
 * A null multiple is not zero and not infinity. It means either too few
 * occurrences to read a trend from, or no earlier weeks to divide by — and
 * those two say different things, so they get different words.
 */
export const multipleLabel = (
  multiple: number | null,
  severity: LpSeverity,
): string => {
  if (multiple !== null) return `${multiple.toFixed(1)}×`;
  return severity === "investigate" ? "new" : "—";
};
