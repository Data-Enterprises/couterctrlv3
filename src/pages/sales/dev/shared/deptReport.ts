import type { SubSale } from "../../../../interfaces";

/**
 * The sub-department comparison, as a report.
 *
 * Opened when a counterpart has been chosen in Stores. The question it answers
 * is not "what are this store's departments" — the single-store tab does that
 * — but "against THAT store, where is the money, and what shape is it".
 *
 * Nothing here grades a department. Two stores are not a baseline for each
 * other, and the client picked the pair: a department running under may be
 * perfectly correct. Everything below is a position and a decomposition, and
 * the only judgement made is which departments are big enough to print.
 */

/** One department's week at one store, with the units behind it. */
interface Side {
  money: number;
  qty: number;
  weight: number;
}

export interface DeptTotals {
  /** The matched department, by normalised description — what the two stores
   *  are paired on, and the row's identity on screen. See `deptKey`. */
  key: string;
  /**
   * The department's number AT EACH STORE, because they are not the same
   * number.
   *
   * Sub-department numbering is a per-store setup. At Brooks, Chapel Hill's
   * 5 is Fresh Meat and Tupelo's 5 is Tobacco; Chapel Hill's 10 is Tobacco
   * and Tupelo's 10 is Deli/Bakery. Pairing on the number compared Chapel
   * Hill's $243.72 of tobacco against $66,072.57 of someone else's deli and
   * called the store $65,828.85 behind on cigarettes.
   *
   * Null on the side that does not carry the department at all.
   */
  mineId: number | null;
  theirsId: number | null;
  /**
   * Both stores carry this department.
   *
   * An unmatched one is not a gap. Tupelo sells fuel and Chapel Hill has no
   * pumps; Chapel Hill rings Lottery and Tupelo does not. Counting either as
   * money the other failed to make is a shortfall nobody can close, and it
   * was the whole of UNLEADED's "-$61,519.29 / Nothing rung" row.
   */
  matched: boolean;
  name: string;
  /** The open store. */
  mine: number;
  theirs: number;
  /**
   * Units, which is WEIGHT where the department rings by weight.
   *
   * `qty` counts lines on a scale item, so money over qty in Produce is money
   * per transaction line, which is not a rate anybody could act on. Follows
   * the data rather than the department's name, the same rule `calculateCogs`
   * uses for cost.
   */
  mineUnits: number;
  theirsUnits: number;
  weighed: boolean;
  /** The same subtraction in the two earlier periods. */
  lwGap: number;
  lyGap: number;
}

/**
 * The gap, taken apart.
 *
 *   mine - theirs  ==  Pt(Um - Ut)  +  Um(Pm - Pt)
 *                       volume          rate
 *
 * Volume is the unit difference valued at the counterpart's rate; rate is the
 * per-unit difference across our own units. It is an identity, so the two
 * always add back to the gap and there is no residual to explain away.
 *
 * `rate` is deliberately not called "price". It carries a real price change
 * AND a change in what sold inside the department, and nothing at this level
 * can separate them — that needs the items.
 */
export interface Split {
  volume: number;
  rate: number;
}

/**
 * Null when the counterpart sold no units at all: there is no rate to value
 * our unit difference at, so the split cannot be formed. A store that sold
 * none is a finding on its own, not a division by zero.
 */
export const splitGap = (d: DeptTotals): Split | null => {
  if (d.theirsUnits <= 0) return null;
  const pt = d.theirs / d.theirsUnits;
  const pm = d.mineUnits > 0 ? d.mine / d.mineUnits : 0;
  // Either half can come out as negative zero — a department we sold none of
  // gives `0 * -pt`. It compares equal to zero and formats as "-$0.00", so
  // it is flattened here rather than in every caller.
  const flat = (v: number) => (v === 0 ? 0 : v);
  return {
    volume: flat(pt * (d.mineUnits - d.theirsUnits)),
    rate: flat(d.mineUnits * (pm - pt)),
  };
};

/* ------------------------------------------------------------------ */
/* The chain                                                           */
/* ------------------------------------------------------------------ */

/**
 * Three gates, asked in order, and the first one that fails is the finding.
 *
 * This replaced printing the volume / price & mix split. The split is an
 * exact decomposition and it tells nobody where to start: it describes a gap
 * rather than triaging it. "Did it ring, did it sell, did it take the same
 * per unit" is a sequence somebody can act on, and it degrades properly —
 * a department this store sells none of simply stops at the first gate
 * instead of producing a half that has to be explained away.
 *
 * The split survives underneath. Where two gates fail it decides which one
 * leads, because the arithmetic knows which is carrying more of the gap and
 * a left-to-right reading does not.
 */
export type GateName = "gap" | "sold" | "rate";

export interface Gate {
  name: GateName;
  /** `skipped` where an earlier gate made this one meaningless — there is no
   *  rate to compare when nothing rang. Drawn grey, not as a failure. */
  state: "pass" | "fail" | "skipped";
  /**
   * What the gate is, and what it found — kept apart because the row draws
   * them apart: the label heads a tile and the figures sit under it.
   *
   * The rate's label carries the word "take" deliberately. It is money over
   * units, a figure no customer paid, and a tile headed "PER LB" would put
   * the one reading back that the sentence works to avoid.
   */
  label: string;
  value: string;
}

export type Finding =
  | "nothing-rung"
  | "fewer-units"
  | "lower-price"
  | "different-mix"
  | "a-little-less"
  | "ahead"
  | "level";

/** Where the items view should land, and what the button says. */
export type Focus = "ringing" | "orders" | "price" | "mix" | "unknown";

/** The sentence, split where the emphasis falls. `lead` is the finding
 *  itself and carries the weight; `tail` is what qualifies it. */
export interface Says {
  lead: string;
  tail: string;
}

export interface Chain {
  gates: Gate[];
  finding: Finding;
  says: Says;
  focus: Focus;
  cta: string;
}

export interface Gates {
  /** Units this far under the counterpart's is a volume failure. */
  units: number;
  /** A realised rate this far under is a rate failure. */
  rate: number;
  /**
   * A rate gap wider than this is not a shelf price.
   *
   * Half the take per pound is not a department that priced low, it is a
   * department selling something else — mince against ribeye. No amount of
   * repricing closes it, so sending somebody to compare price tags would
   * send them to the one place the answer is not.
   */
  mix: number;
}

export const DEFAULT_GATES: Gates = { units: 0.05, rate: 0.05, mix: 0.25 };

const CTA: Record<Focus, string> = {
  ringing: "Check ringing",
  orders: "Check orders",
  price: "Check prices",
  mix: "Check the mix",
  unknown: "Investigate",
};

const FOCUS: Record<Finding, Focus> = {
  "nothing-rung": "ringing",
  "fewer-units": "orders",
  "lower-price": "price",
  "different-mix": "mix",
  "a-little-less": "unknown",
  ahead: "unknown",
  level: "unknown",
};

const cash = (v: number) =>
  "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
/**
 * A percentage, floored off 100 unless it really is everything.
 *
 * `Math.round` turned a ratio of 0.005 into "100% fewer units", which reads
 * as NONE AT ALL -- a stronger claim than the data makes, and the one
 * rounding where the word changes rather than the digit. Chapel Hill rang 16
 * units of tobacco against Tupelo's 9,051 and was told it had rung nothing.
 */
const pct = (v: number) => {
  const whole = Math.round(Math.abs(v) * 100);
  const exact = Math.abs(v) >= 1;
  return (whole >= 100 && !exact ? 99 : whole) + "%";
};

/** What a gate the chain never reached shows instead of a figure. */
export const NOT_CHECKED = "Not checked";

export const chainFor = (d: DeptTotals, g: Gates = DEFAULT_GATES): Chain => {
  const unit = d.weighed ? "lb" : "units";
  const one = d.weighed ? "lb" : "unit";

  const rang = d.mine > 0 || d.mineUnits > 0;
  const comparable = d.mineUnits > 0 && d.theirsUnits > 0;
  const unitGap = d.theirsUnits > 0 ? d.mineUnits / d.theirsUnits - 1 : null;
  const mineRate = d.mineUnits > 0 ? d.mine / d.mineUnits : null;
  const theirsRate = d.theirsUnits > 0 ? d.theirs / d.theirsUnits : null;
  const rateGap =
    mineRate !== null && theirsRate !== null && theirsRate > 0
      ? mineRate / theirsRate - 1
      : null;

  const soldOk = unitGap === null || unitGap >= -g.units;
  const rateOk = rateGap === null || rateGap >= -g.rate;

  const gates: Gate[] = [
    /*
     * The gap itself, not a check on it.
     *
     * This slot used to ask whether the department rang anything at all —
     * true of almost every department, so the tile was green almost always,
     * including on departments five figures down. A green that cannot fail
     * is not a signal, and a false green costs more than a missing one: it
     * tells a reader something is fine.
     *
     * The gap can go either way and is the figure the other two explain.
     */
    {
      name: "gap",
      state: d.mine >= d.theirs ? "pass" : "fail",
      label: "Sales gap",
      value: (d.mine - d.theirs >= 0 ? "+" : "−") + cash(Math.abs(d.mine - d.theirs)),
    },
    {
      name: "sold",
      state: !rang ? "skipped" : soldOk ? "pass" : "fail",
      label: "Sold",
      value:
        !rang || unitGap === null
          ? NOT_CHECKED
          : pct(unitGap) + (unitGap < 0 ? " fewer " : " more ") + unit,
    },
    {
      name: "rate",
      // A take per unit, never a price: it is money over units, and no
      // customer paid it. The real price points come off the items.
      state: !comparable ? "skipped" : rateOk ? "pass" : "fail",
      label: "Take per " + one,
      value:
        mineRate === null || theirsRate === null
          ? NOT_CHECKED
          : cash(mineRate) + " vs " + cash(theirsRate),
    },
  ];

  let finding: Finding;
  if (!rang) {
    finding = "nothing-rung";
  } else if (soldOk && rateOk) {
    // Level means level. A department three thousand dollars up passed both
    // gates too, and calling that "level with the other store" was fine
    // while these were a count in a footer — it is not, now that each one
    // gets a panel of its own to say it in.
    finding =
      d.mine < d.theirs ? "a-little-less" : d.mine > d.theirs ? "ahead" : "level";
  } else if (soldOk) {
    finding = rateGap !== null && rateGap <= -g.mix ? "different-mix" : "lower-price";
  } else if (rateOk) {
    finding = "fewer-units";
  } else {
    // Both gates down. The split knows which half is carrying more of the
    // gap; reading left to right would always blame volume.
    const s = splitGap(d);
    const volumeLeads = s === null || Math.abs(s.volume) >= Math.abs(s.rate);
    finding = volumeLeads
      ? "fewer-units"
      : rateGap !== null && rateGap <= -g.mix
        ? "different-mix"
        : "lower-price";
  }

  const perUnit =
    mineRate !== null && theirsRate !== null ? theirsRate - mineRate : 0;

  const says: Says =
    finding === "nothing-rung"
      ? { lead: "Nothing rung", tail: " all week." }
      : finding === "fewer-units"
        ? {
            lead: "Sold " + pct(unitGap ?? 0) + " fewer " + unit,
            tail:
              ", " + whole(Math.abs(d.theirsUnits - d.mineUnits)) + " " +
              unit + " behind.",
          }
        : finding === "lower-price"
          ? { lead: "Took " + cash(perUnit) + " less per " + one, tail: "." }
          : finding === "different-mix"
            ? {
                lead: "Took " + cash(perUnit) + " less per " + one,
                tail: " — far more than a price difference.",
              }
            : finding === "ahead"
              ? {
                  lead: "Ahead",
                  tail:
                    unitGap !== null && unitGap > 0
                      ? ", on " + pct(unitGap) + " more " + unit + "."
                      : " on a higher take per " + one + ".",
                }
            : finding === "a-little-less"
              ? {
                  lead: "A little less of everything",
                  tail: ", with nothing standing out.",
                }
              : { lead: "Level", tail: " with the other store." };

  const focus = FOCUS[finding];
  return { gates, finding, says, focus, cta: CTA[focus] };
};

export interface ReportRow extends DeptTotals {
  gap: number;
  /** Kept, not printed: it is what decides which gate leads when two fail. */
  split: Split | null;
  chain: Chain;
  /** How far behind in its OWN terms, 0–1. Negative where it is ahead. */
  dropoff: number;
}

export interface Bands {
  /** Departments print in full until the running share of what is under
   *  reaches this. 0.6 = 60%. */
  cut: number;
  /** A folded department this far behind in its own terms is named anyway. */
  steep: number;
}

export const DEFAULT_BANDS: Bands = { cut: 0.6, steep: 0.4 };

export interface Report {
  /** Ranked by shortfall, biggest first. */
  under: ReportRow[];
  over: ReportRow[];
  /** The ones that print in full, and the rest. */
  shown: ReportRow[];
  folded: ReportRow[];
  /**
   * Folded by money, but a long way behind in their own terms.
   *
   * The cut ranks by dollars, which is right for where the money is — and it
   * means a department doing half what its counterpart does can never surface
   * if it is small. The two readings answer different questions: dollars say
   * what is worth the most, the drop-off says what is most likely to be
   * actually broken rather than merely smaller.
   */
  steep: ReportRow[];
  /**
   * Departments that failed the SAME gate, biggest group first.
   *
   * Four departments that rang nothing are one problem with one owner, not
   * four rows. Grouping them is better triage than a size ranking, and it
   * catches the small-but-broken department the dollar cut can never reach.
   */
  byFinding: { finding: Finding; rows: ReportRow[]; total: number }[];
  underTotal: number;
  overTotal: number;
  /**
   * Departments only one of the two stores carries.
   *
   * Kept out of the piles and out of the findings, because they are not a
   * shortfall: Tupelo sells fuel and Chapel Hill has no pumps. Shown on their
   * own, with their own totals, so the money is still accounted for and
   * nobody has to wonder where it went.
   */
  onlyMine: ReportRow[];
  onlyTheirs: ReportRow[];
  onlyMineTotal: number;
  onlyTheirsTotal: number;
  /** Under netted against over, across the departments both stores carry. */
  matchedNet: number;
  /**
   * The whole difference between the two stores, comparable or not.
   *
   * `matchedNet` plus what only one of them sells, so the three parts on
   * screen add back to it and the reader can see which is which.
   */
  netGap: number;
  /** What the printed departments account for, 0–1. */
  shownShare: number;
}

const rowOf = (d: DeptTotals, gates: Gates): ReportRow => ({
  ...d,
  gap: d.mine - d.theirs,
  split: splitGap(d),
  chain: chainFor(d, gates),
  dropoff: d.theirs > 0 ? (d.theirs - d.mine) / d.theirs : 0,
});

export const buildReport = (
  depts: DeptTotals[],
  bands: Bands = DEFAULT_BANDS,
  gates: Gates = DEFAULT_GATES,
): Report => {
  const all = depts.map((d) => rowOf(d, gates));

  /**
   * Comparable first, and only those get a gap.
   *
   * A department one store does not carry has no counterpart to be behind,
   * so putting it in the piles invents a shortfall: UNLEADED read
   * "-$61,519.29 / Nothing rung" against a store with no pumps. Its money is
   * not lost from the report -- it is counted below, on its own side.
   */
  const rows = all.filter((r) => r.matched);
  const onlyMine = all
    .filter((r) => !r.matched && r.mine > 0)
    .sort((a, b) => b.mine - a.mine);
  const onlyTheirs = all
    .filter((r) => !r.matched && r.theirs > 0)
    .sort((a, b) => b.theirs - a.theirs);
  const onlyMineTotal = onlyMine.reduce((t, r) => t + r.mine, 0);
  const onlyTheirsTotal = onlyTheirs.reduce((t, r) => t + r.theirs, 0);

  const under = rows
    .filter((r) => r.gap < 0)
    .sort((a, b) => a.gap - b.gap);
  const over = rows.filter((r) => r.gap >= 0).sort((a, b) => b.gap - a.gap);

  const underTotal = under.reduce((t, r) => t - r.gap, 0);
  const overTotal = over.reduce((t, r) => t + r.gap, 0);

  /**
   * Cut on CUMULATIVE share rather than per department.
   *
   * A fixed "anything over 10%" threshold breaks at both ends — it shows
   * nothing on a store whose shortfall is spread and one row on a store where
   * it is concentrated. This adapts, so the report's LENGTH is itself a
   * reading of how concentrated the problem is.
   *
   * Tested on the running total BEFORE a department is added, so the one that
   * carries it past the line is itself shown. Deciding it afterwards would
   * fold away a 10%-of-the-shortfall department for the crime of being the
   * one that crossed. Same rule as `forecastRanking`'s A/B/C split.
   */
  const shown: ReportRow[] = [];
  const folded: ReportRow[] = [];
  let running = 0;
  for (const r of under) {
    if (running < bands.cut) shown.push(r);
    else folded.push(r);
    // A zero total leaves every share at 0, so nothing ever advances and
    // every department prints. That is the honest answer when there is
    // nothing to apportion.
    running += underTotal > 0 ? -r.gap / underTotal : 0;
  }

  const steep = folded
    .filter((r) => r.dropoff > bands.steep)
    .sort((a, b) => b.dropoff - a.dropoff);

  const shownTotal = shown.reduce((t, r) => t - r.gap, 0);

  const grouped = new Map<Finding, ReportRow[]>();
  for (const r of under) {
    const at = grouped.get(r.chain.finding);
    if (at) at.push(r);
    else grouped.set(r.chain.finding, [r]);
  }
  const byFinding = [...grouped.entries()]
    .map(([finding, rows]) => ({
      finding,
      rows,
      total: rows.reduce((t, r) => t - r.gap, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    under,
    byFinding,
    over,
    shown,
    folded,
    steep,
    underTotal,
    overTotal,
    onlyMine,
    onlyTheirs,
    onlyMineTotal,
    onlyTheirsTotal,
    matchedNet: overTotal - underTotal,
    netGap: overTotal - underTotal + onlyMineTotal - onlyTheirsTotal,
    shownShare: underTotal > 0 ? shownTotal / underTotal : 0,
  };
};

/* ------------------------------------------------------------------ */
/* Getting there from the payload                                      */
/* ------------------------------------------------------------------ */

/**
 * The handle two stores can be compared on.
 *
 * Not the number -- that is per store. The description is the only thing in
 * the data that means the same at both, and it is written by hand at each
 * one, so "Non-Foods" has to meet "Non-Food" and "Fresh Meat" has to meet
 * "FRESH MEAT". Case and a trailing s are the two differences actually seen
 * in the Brooks data; anything further apart than that -- Cold Deli against
 * Deli/Bakery, Package Meats against Meat -- is left unmatched on purpose.
 * Those are not the same department, and guessing is how you get a $65,828.85
 * tobacco gap.
 *
 * A real department mapping would be better than this and does not exist:
 * identity lives on the sales rows, as a number and a description, per store.
 */
export const deptKey = (description: string) =>
  description.trim().toLowerCase().replace(/s$/, "");

const sidesBySubDept = (rows: SubSale[]) =>
  rows.reduce<Record<string, Side & { name: string; id: number }>>((acc, s) => {
    const k = deptKey(s.sub_department_description);
    if (!acc[k])
      acc[k] = {
        name: s.sub_department_description,
        id: s.sub_department,
        money: 0,
        qty: 0,
        weight: 0,
      };
    // `total_sales - total_tax`, the basis the whole page is on — see the
    // note in PopupSubDeptList for why it is not `net_sales`.
    acc[k].money += s.total_sales - s.total_tax;
    acc[k].qty += s.qty;
    acc[k].weight += s.weight;
    return acc;
  }, {});

export interface Periods {
  mineTw: SubSale[];
  mineLw: SubSale[];
  mineLy: SubSale[];
  theirsTw: SubSale[];
  theirsLw: SubSale[];
  theirsLy: SubSale[];
}

export const totalsFrom = (p: Periods): DeptTotals[] => {
  const mTw = sidesBySubDept(p.mineTw);
  const mLw = sidesBySubDept(p.mineLw);
  const mLy = sidesBySubDept(p.mineLy);
  const tTw = sidesBySubDept(p.theirsTw);
  const tLw = sidesBySubDept(p.theirsLw);
  const tLy = sidesBySubDept(p.theirsLy);

  // Every department either store has in any week — one of them not carrying
  // a department is a finding, not a row to drop.
  const ids = [
    ...new Set([mTw, mLw, mLy, tTw, tLw, tLy].flatMap((m) => Object.keys(m))),
  ];

  const money = (m: Record<string, Side>, id: string) => m[id]?.money ?? 0;

  return ids.map((id) => {
    const mine = mTw[id];
    const theirs = tTw[id];
    const inBoth = Boolean(
      (mine ?? mLw[id] ?? mLy[id]) && (theirs ?? tLw[id] ?? tLy[id]),
    );
    // Weight only counts as the unit when BOTH sides ring by it. One store
    // weighing and the other not is a data oddity, and comparing pounds
    // against lines would be worse than comparing lines against lines.
    const weighed = (mine?.weight ?? 0) > 0 && (theirs?.weight ?? 0) > 0;
    const units = (s?: Side) => (weighed ? (s?.weight ?? 0) : (s?.qty ?? 0));

    return {
      key: id,
      matched: inBoth,
      // The open store's number leads, because the investigation drills into
      // ITS department first; `theirsId` travels with it so the counterpart
      // is fetched by its own number rather than by ours.
      mineId: (mine ?? mLw[id] ?? mLy[id])?.id ?? null,
      theirsId: (theirs ?? tLw[id] ?? tLy[id])?.id ?? null,
      name:
        mine?.name ??
        theirs?.name ??
        mLy[id]?.name ??
        tLy[id]?.name ??
        `Sub dept ${id}`,
      mine: money(mTw, id),
      theirs: money(tTw, id),
      mineUnits: units(mine),
      theirsUnits: units(theirs),
      weighed,
      lwGap: money(mLw, id) - money(tLw, id),
      lyGap: money(mLy, id) - money(tLy, id),
    };
  });
};
