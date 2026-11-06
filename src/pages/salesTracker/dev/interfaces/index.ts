// Interfaces

/**
 * Which period the window is measured against: last year (the default; it
 * carries the season), or last week for a store with no last year. One basis
 * for the whole window, never a mix.
 */
export type TrackerBasis = "LY" | "LW";

export type WeekBucket = {
  index: number;
  start: string;
  end: string;
  /** The seven TY dates, ascending. */
  dates: string[];
};

export type DayPair = {
  tyDate: string;
  /** The day this one is compared against — last year's partner, or last
   *  week's, depending on the plan's basis. */
  lyDate: string;
  weekIndex: number;
  /** 0-6 within the bucket. Fixed at build time so the Days grid keeps a
   *  stable column even where a holiday shifts the LY partner's weekday. */
  slot: number;
};

export type WindowPlan = {
  /** What `lyDate`, `lyStart` and `lyEnd` mean on this plan. */
  basis: TrackerBasis;
  weeks: WeekBucket[];
  pairs: DayPair[];
  tyStart: string;
  tyEnd: string;
  lyStart: string;
  lyEnd: string;
  byTyDate: Map<string, DayPair>;
  /** Keyed by LY date. An array because a holiday can pull two TY days onto
   *  one LY date — see `collisions`. */
  byLyDate: Map<string, DayPair[]>;
  /**
   * TY dates sharing an LY partner with another TY date: `sameWeekDayLastYear`
   * snaps a holiday to its real date, so a neighbour can collide. Flagged in
   * the UI rather than averaged.
   */
  collisions: string[];
};

export interface TrackerScope {
  url: string;
  token: string;
  useGroups: number;
  searchValue: number;
  singleStore: number;
}

export type DayTotal = {
  date: string;
  lyDate: string;
  salesTy: number;
  /** null where last year has no matching day at all — distinct from a day
   *  that genuinely took nothing. */
  salesLy: number | null;
  trans: number;
  ats: number | null;
  dollarChange: number | null;
  pctChange: number | null;
  /** No rows came back for this date. Every date is enumerated up front, so a
   *  quiet day is a zero, not a hole. */
  noSales: boolean;
};

export type WeekTotal = {
  index: number;
  start: string;
  end: string;
  /** In order. Usually seven — but a range that isn't a multiple of seven
   *  leaves the last bucket short, so nothing here may assume it. */
  days: DayTotal[];
  salesTy: number;
  salesLy: number | null;
  trans: number;
  ats: number | null;
  dollarChange: number | null;
  pctChange: number | null;
  /**
   * How the week's days split (up, down, worst), so a closed card says more than
   * its total. Only days with a last-year partner count.
   */
  upDays: number;
  downDays: number;
  comparedDays: number;
  /** The day that cost the most money. Ranked on dollars, like every other
   *  "worst" on this page, so the label can't disagree with the sort. */
  worstDay: DayTotal | null;
};

export type SubDeptTotal = {
  id: number;
  desc: string;
  weeks: WeekTotal[];
  salesTy: number;
  salesLy: number | null;
  trans: number;
  ats: number | null;
  dollarChange: number | null;
  pctChange: number | null;
};

export type SortColumn = "dept" | "ty" | "ly" | "ats" | "dollar";
