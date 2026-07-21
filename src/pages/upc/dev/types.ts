export type KpiCell = {
  label: string;
  value: string;
  sub?: string;
  variant?: "up" | "down";
  // Independent from `variant` — lets a tile keep a neutral main value
  // (e.g. a plain dollar total) while still color-coding its inline sub
  // annotation by direction. "neutral" is for a confirmed-no-change
  // annotation (distinct from omitting `sub` entirely, which should only
  // mean "nothing to compare"). Falls back to a fixed attention color when
  // unset, for flags like "was Fri LY" that aren't inherently up/down.
  subVariant?: "up" | "down" | "neutral";
};
