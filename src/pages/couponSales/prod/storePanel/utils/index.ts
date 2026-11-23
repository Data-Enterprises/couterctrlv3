/** The grades that get a filter chip; ungraded has none. */
type ChipTier = "critical" | "watch" | "ok";

/** Each grade chip's fill and text. Written out whole so Tailwind sees them. */
export const TIER_CHIP_BASE: Record<ChipTier, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  ok: "bg-severity_healthy_bg text-severity_healthy_text",
};

/** The ring a grade chip wears while its filter is on. */
export const TIER_CHIP_ON: Record<ChipTier, string> = {
  critical: "ring-2 ring-severity_critical_text/40 shadow-sm",
  watch: "ring-2 ring-severity_watch_text/40 shadow-sm",
  ok: "ring-2 ring-severity_healthy_text/40 shadow-sm",
};
