// Interfaces

/**
 * Which period the window is measured against.
 *
 * Last year is the default and the better comparison: it carries the season
 * with it. Last week is the fallback for a store that has no last year — one
 * that opened this year, or changed system — because a tracker with an empty
 * comparison column is a tracker with nothing to say.
 *
 * It is one basis for the whole window, never a mix. A column headed LY whose
 * rows are sometimes last week is a column that lies, and the figure it holds
 * cannot be read without checking which row it came from.
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
   * TY dates sharing an LY partner with another TY date.
   *
   * `sameWeekDayLastYear` snaps a holiday to the actual holiday date last
   * year rather than shifting by weekday, so in a window containing one the
   * shifted neighbour can land on the same LY date. Both TY days would then
   * compare against the same LY figure, inflating one of them. The UI flags
   * these rather than silently averaging: the comparison is genuinely
   * ambiguous and the user is better placed to judge it.
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
  /** No rows came back for this date. Legacy stitched these in afterwards by
   *  walking for gaps; here every date in the window is enumerated up front by
   *  the plan, so a quiet day is a zero rather than a hole. */
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
   * How the week's days split, so a closed card can say more than its total.
   *
   * A week down four percent reads the same whether every day was down four,
   * or six days were flat and Saturday fell off a cliff — and those are
   * different problems. Only days with a last-year partner are counted; a day
   * with nothing to compare is neither good nor bad.
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
