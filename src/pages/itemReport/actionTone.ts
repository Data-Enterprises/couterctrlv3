import type { ActionKind } from "./itemReportMetrics";

/**
 * How each action looks. One definition, because the sheet's chips and the
 * invoice modal's highlighted row have to agree — a row washed in one colour
 * while its action chip is another is worse than no colour at all.
 *
 * `row` and `text` are the chip's fill and foreground, split apart. A washed row
 * needs both, but on different elements — the wash on the row, the foreground on
 * each cell, because a cell's own `text-content` would otherwise win over
 * anything inherited from the row.
 */
export const ACTION_TONE: Record<
  ActionKind,
  { chip: string; ring: string; rule: string; row: string; text: string }
> = {
  investigate: {
    chip: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
    rule: "border-transparent",
    row: "bg-severity_critical_bg",
    text: "text-severity_critical_text",
  },
  reorder: {
    chip: "bg-blue-50 text-blue-900",
    ring: "ring-blue-900/40",
    rule: "border-blue-500",
    row: "bg-blue-50",
    text: "text-blue-900",
  },
  reprice: {
    chip: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
    rule: "border-amber-500",
    row: "bg-severity_watch_bg",
    text: "text-severity_watch_text",
  },
  vendor: {
    chip: "bg-violet-50 text-violet-900",
    ring: "ring-violet-900/40",
    rule: "border-transparent",
    row: "bg-violet-50",
    text: "text-violet-900",
  },
  none: {
    chip: "bg-severity_healthy_bg text-severity_healthy_text",
    ring: "ring-severity_healthy_text/40",
    rule: "border-emerald-500",
    row: "bg-severity_healthy_bg",
    text: "text-severity_healthy_text",
  },
  insufficient: {
    chip: "bg-gray-100 text-content/85",
    ring: "ring-content/30",
    rule: "border-gray-300",
    row: "bg-gray-100",
    text: "text-content",
  },
  /** Quiet on purpose. It is a state, not a finding, and colouring it would
   *  give a row that says nothing the same weight as one that does. */
  pending: {
    chip: "bg-gray-50 text-content/85",
    ring: "ring-content/20",
    rule: "border-transparent",
    row: "bg-gray-50",
    text: "text-content",
  },
};
