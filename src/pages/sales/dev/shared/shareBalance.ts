import type { ComparisonRow } from "./storeComparison";

/**
 * Share of the group, as a balance.
 *
 * Shares total 100%, so a store can only gain weight by taking it from the
 * others. That makes this the one view on the page where a finding has a
 * matching counter-finding: no store drops weight without another picking it
 * up, and the panel can say which.
 *
 * The identity is exact, not approximate. `expected = groupTotal ×
 * usualShare`, so
 *
 *     gapValue = ty − expected
 *              = groupTotal × (shareTy − usualShare)
 *
 * The money a store is up or down IS its share change priced at the group's
 * week. Summed over the counted stores the share changes cancel, so the
 * money does too.
 *
 * Deliberately separate from `verdictOf` in `storeComparison`, which grades
 * the KPI strip above. That one measures the gap as a PERCENTAGE OF THE
 * STORE, so the same 0.9-point move is a bad week for a 9% store and a fine
 * one for a 22% store — fair to size, and asymmetric by design. This measures
 * it in absolute points so a fall always has a matching rise. Two questions,
 * two rules; neither is the other's bug.
 */

/**
 * How much share a store must move to be worth naming, in points.
 *
 * Under half a point is the rounding of a normal week: on Bruces' $1.37M
 * group five of eight stores moved a tenth of a point each, which is real
 * money and not a finding. Above it, the money is large enough that somebody
 * would want to know where it went.
 */
export const SHARE_BAND_PCT = 0.5;

export type ShareStanding = "falling" | "consistent" | "rising";

export interface ShareRow {
  storeid: number;
  storeName: string;
  storeNumber: string;
  /** Every store_number this storeid returned. Carried because co-located
   *  stores share one id: the name resolves identically for both and only
   *  the number tells them apart. */
  storeNumbersForId: string[];
  /** Share of the group this week, as a percentage. */
  sharePct: number;
  /** The share its basis says it usually takes, as a percentage. */
  usualPct: number;
  /** `sharePct - usualPct`. Points of the group, written as % on screen. */
  changePct: number;
  /** That change priced at the group's week — the row's `gapValue`. */
  money: number;
  standing: ShareStanding;
  /** Its own week against itself, carried so a row can say whether it grew. */
  ownPct: number | null;
}

export const shareStandingOf = (
  changePct: number,
  band: number = SHARE_BAND_PCT,
): ShareStanding =>
  changePct < -band ? "falling" : changePct > band ? "rising" : "consistent";

/**
 * The counted stores, biggest share first.
 *
 * Rows without a basis are dropped rather than shown at zero: a store with no
 * history has no usual share, and placing it at nought would have it look
 * like the week's biggest loser.
 */
export const shareRowsOf = (
  rows: ComparisonRow[],
  band: number = SHARE_BAND_PCT,
): ShareRow[] =>
  rows
    .filter(
      (r) =>
        r.excluded === null &&
        r.shareTy !== null &&
        r.usualShare !== null &&
        r.gapValue !== null,
    )
    .map((r) => {
      const sharePct = r.shareTy! * 100;
      const usualPct = r.usualShare! * 100;
      const changePct = sharePct - usualPct;
      return {
        storeid: r.storeid,
        storeName: r.storeName,
        storeNumber: r.storeNumber,
        storeNumbersForId: r.storeNumbersForId,
        sharePct,
        usualPct,
        changePct,
        money: r.gapValue!,
        standing: shareStandingOf(changePct, band),
        ownPct: r.ownPct,
      };
    })
    .sort((a, b) => b.sharePct - a.sharePct);

/**
 * The list's own order: the band that needs attention first, and inside each
 * band the biggest mover first.
 *
 * Falling leads because it is the only band anybody opened the panel for.
 * Rising is the answer to it and sits at the bottom, where it reads as the
 * other side of the same money rather than as a league table.
 */
export const STANDING_ORDER: Record<ShareStanding, number> = {
  falling: 0,
  consistent: 1,
  rising: 2,
};

export const byStanding = (rows: ShareRow[]): ShareRow[] =>
  [...rows].sort(
    (a, b) =>
      STANDING_ORDER[a.standing] - STANDING_ORDER[b.standing] ||
      Math.abs(b.money) - Math.abs(a.money),
  );

export interface ShareBalance {
  /** Lost share, worst first. */
  lost: ShareRow[];
  /** Gained share, biggest first. */
  gained: ShareRow[];
  /** Always zero or negative. */
  lostTotal: number;
  /** Always zero or positive, and equal in size to `lostTotal`. */
  gainedTotal: number;
  /**
   * How far the two sides are from cancelling, in money.
   *
   * Zero when every counted store is graded on the same period. It is not
   * when they are mixed: `usualShare` is last year's share for some rows and
   * last week's for others, and those two sets each total 100% on their own.
   * Surfaced rather than hidden — a balance that does not balance should say
   * so rather than quietly round.
   */
  imbalance: number;
}

export const shareBalanceOf = (rows: ShareRow[]): ShareBalance => {
  const lost = rows
    .filter((r) => r.money < 0)
    .sort((a, b) => a.money - b.money);
  const gained = rows
    .filter((r) => r.money > 0)
    .sort((a, b) => b.money - a.money);
  const lostTotal = lost.reduce((n, r) => n + r.money, 0);
  const gainedTotal = gained.reduce((n, r) => n + r.money, 0);
  return {
    lost,
    gained,
    lostTotal,
    gainedTotal,
    imbalance: gainedTotal + lostTotal,
  };
};

/** How many stores sit at each standing, for the band headings. */
export const shareStandingCounts = (
  rows: ShareRow[],
): Record<ShareStanding, number> => {
  const out: Record<ShareStanding, number> = {
    falling: 0,
    consistent: 0,
    rising: 0,
  };
  rows.forEach((r) => (out[r.standing] += 1));
  return out;
};

/**
 * The store on the other side of the balance that most nearly matches this
 * one's move.
 *
 * Shares total 100%, so a store that gave up ground gave it to somebody. This
 * names the likeliest counterpart — the opposite mover closest in size — and
 * nothing more: it is an arithmetic pairing, not a claim that one store's
 * customers walked to the other.
 *
 * Null for a store that held its ground, which has nothing to pair with.
 */
export const counterweightOf = (
  row: ShareRow,
  rows: ShareRow[],
): ShareRow | null => {
  if (row.money === 0) return null;
  const wanted = Math.abs(row.money);
  const others = rows.filter(
    (r) =>
      !(r.storeid === row.storeid && r.storeNumber === row.storeNumber) &&
      Math.sign(r.money) === -Math.sign(row.money),
  );
  if (!others.length) return null;
  return others.reduce((best, r) =>
    Math.abs(Math.abs(r.money) - wanted) <
    Math.abs(Math.abs(best.money) - wanted)
      ? r
      : best,
  );
};
