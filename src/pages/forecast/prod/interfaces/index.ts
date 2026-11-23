// Interfaces
import type { ForecastTier } from "../../../../interfaces";

export type SortCol =
  "qtySold" | "adFcst" | "fcstTotal" | "markdownDollars" | "fcstPrice";

// ForecastTier lives in src/interfaces (a slice holds it); Tier here for short.
export type Tier = ForecastTier;

export interface RankEntry {
  /** 1-based position by contribution. The ranking, stated outright. */
  rank: number;
  /** Share of the selection's forecast total, 0–1. */
  share: number;
  /** Running total through this row once sorted by contribution, 0–1. */
  cumulative: number;
  tier: Tier;
  /** Share of the selection's markdown, 0–1. */
  markdownShare: number;
}

export type ExceptionKind = "thin" | "untested" | "costly" | "record";

export interface Exception {
  kind: ExceptionKind;
  /** Shown on hover — says what was measured, not what to do about it. */
  detail: string;
}
