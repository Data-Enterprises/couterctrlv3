// Interfaces
import type { ItemSeverity } from "../../utils/itemMargins";

/** One row an assign panel lists: an id, its label and an optional second line. */
export interface AssignPanelItem {
  id: number;
  label: string;
  sublabel?: string;
}

/** A call-to-action's border, fill, hover fill and text classes. */
export interface CtaTone {
  border: string;
  bg: string;
  hoverBg: string;
  text: string;
}

/** One day card's label, figures and comparison, as display strings. */
export interface DayCardEntry {
  /** YYYY-MM-DD. Also the selection value. */
  iso: string;
  /** Headline figure, already formatted. */
  value: string;
  /** Percentage move against the comparison period; null when ungraded. */
  delta: number | null;
  /** Hover text for the delta, e.g. the baseline value behind it. */
  deltaTitle?: string;
  /**
   * Overrides for the card's own wording, all optional so every existing caller
   * keeps the weekday-and-date default.
   *
   * Suggested Weight needs them because its cards are NOT that date's figure:
   * they are the weekday's average, shown against the date it will be delivered
   * against. Rendering "Saturday 9/12 — 1,151 lb" reads as a forecast for that
   * Saturday, which the number is not. "Saturdays / covers 9/12 / 1,151 lb
   * typical" says the same thing truthfully in the same space.
   */
  /** Replaces the weekday name on the top line. */
  label?: string;
  /** Replaces the m/d on the second line. */
  subLabel?: string;
  /** Small qualifier printed after the value, e.g. "typical". */
  valueNote?: string;
  /**
   * Which baseline the delta is measured against — "LY" or "LW" — printed
   * after the percentage so the card says what it is comparing to. Per-card
   * rather than per-strip because a day can have a last-year figure while the
   * day beside it only has last week.
   *
   * Left off by pages that grade against something else: LP and Coupon Sales
   * compare each day to a rolling baseline of prior weeks, and labelling that
   * "LY" would be false.
   */
  basis?: string;
}

/** The items table's severity filter: all, or one grade. */
export type SevFilter = "all" | ItemSeverity;

/**
 * One tile of the band. Authored here now that four UPC panels, Item Actions
 * and LP Actions all render through it — it was never a UPC type.
 */
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

/** UPCs grouped by grade. */
export interface SeverityUpcs {
  critical: string[];
  watch: string[];
  healthy: string[];
}
