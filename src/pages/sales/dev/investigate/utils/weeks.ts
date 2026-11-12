// Interfaces
import type { WeeksVerdict } from "../interfaces";

/** How many times as wide, in words where words read better. */
const times = (r: number) =>
  r < 2.5
    ? "twice"
    : r < 3.5
      ? "three times"
      : r < 4.5
        ? "four times"
        : `${Math.round(r)} times`;

/** Inside a tenth either way, last week and this week are the same gap. */
const STEADY = 0.1;

/**
 * The week-by-week card's answer: a standing difference, or something that
 * broke this week. Read off the three gaps (last year, last week, this week),
 * so the reader is told rather than left to compare bar lengths.
 */
export const weeksSay = (
  weeks: { label: string; gap: number }[],
  fmt: (v: number) => string,
): WeeksVerdict => {
  const [ly, lw, tw] = weeks.map((w) => w.gap);

  if (tw >= 0)
    return {
      tone: "ahead",
      lead: "Ahead this week.",
      rest:
        lw < 0
          ? `Up from ${fmt(Math.abs(lw))} behind last week.`
          : `${fmt(tw)} ahead, against ${fmt(lw)} ahead last week.`,
    };

  const now = Math.abs(tw);
  if (lw >= 0)
    return {
      tone: "worse",
      lead: "Something broke this week.",
      rest: `${fmt(now)} behind, after being ${lw > 0 ? `${fmt(lw)} ahead` : "level"} last week.`,
    };

  const was = Math.abs(lw);
  const change = now - was;
  const base =
    change > was * STEADY
      ? { tone: "worse" as const, lead: "Getting worse.", rest: `${fmt(change)} further behind than last week` }
      : change < -was * STEADY
        ? { tone: "better" as const, lead: "Getting better.", rest: `${fmt(-change)} less behind than last week` }
        : { tone: "steady" as const, lead: "A standing difference.", rest: "About the same as last week" };

  const r = ly < 0 ? now / Math.abs(ly) : null;
  const lastYear =
    r === null
      ? ly > 0
        ? ", when it was ahead last year."
        : "."
      : r >= 1.5
        ? `, and ${times(r)} last year's gap.`
        : r <= 0.67
          ? ", and narrower than last year."
          : ", and about what it was last year.";

  return { ...base, rest: base.rest + lastYear };
};
