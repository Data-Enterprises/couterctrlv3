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
  id: number;
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
export type GateName = "rung" | "sold" | "rate";

export interface Gate {
  name: GateName;
  /** `skipped` where an earlier gate made this one meaningless — there is no
   *  rate to compare when nothing rang. Drawn grey, not as a failure. */
  state: "pass" | "fail" | "skipped";
  /** The figures behind the mark, for the trail under the sentence. */
  detail: string;
}

export type Finding =
  | "nothing-rung"
  | "fewer-units"
  | "lower-price"
  | "different-mix"
  | "a-little-less"
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
  level: "unknown",
};

const cash = (v: number) =>
  "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (v: number) => Math.round(Math.abs(v) * 100) + "%";

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
    {
      name: "rung",
      state: rang ? "pass" : "fail",
      detail: rang
        ? cash(d.mine) + " rung"
        : cash(0) + " against " + cash(d.theirs),
    },
    {
      name: "sold",
      state: !rang ? "skipped" : soldOk ? "pass" : "fail",
      detail:
        !rang || unitGap === null
          ? "Sold"
          : "Sold " + pct(unitGap) + (unitGap < 0 ? " fewer " : " more ") + unit,
    },
    {
      name: "rate",
      // A take per unit, never a price: it is money over units, and no
      // customer paid it. The real price points come off the items.
      state: !comparable ? "skipped" : rateOk ? "pass" : "fail",
      detail:
        mineRate === null || theirsRate === null
          ? "Take per " + one
          : cash(mineRate) + " a " + one + " against " + cash(theirsRate),
    },
  ];

  let finding: Finding;
  if (!rang) {
    finding = "nothing-rung";
  } else if (soldOk && rateOk) {
    finding = d.mine < d.theirs ? "a-little-less" : "level";
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
  /** Under netted against over — the figure the Stores tab shows. */
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
  const rows = depts.map((d) => rowOf(d, gates));
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
    netGap: overTotal - underTotal,
    shownShare: underTotal > 0 ? shownTotal / underTotal : 0,
  };
};

/* ------------------------------------------------------------------ */
/* Getting there from the payload                                      */
/* ------------------------------------------------------------------ */

const sidesBySubDept = (rows: SubSale[]) =>
  rows.reduce<Record<number, Side & { name: string }>>((acc, s) => {
    if (!acc[s.sub_department])
      acc[s.sub_department] = {
        name: s.sub_department_description,
        money: 0,
        qty: 0,
        weight: 0,
      };
    // `total_sales - total_tax`, the basis the whole page is on — see the
    // note in PopupSubDeptList for why it is not `net_sales`.
    acc[s.sub_department].money += s.total_sales - s.total_tax;
    acc[s.sub_department].qty += s.qty;
    acc[s.sub_department].weight += s.weight;
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
    ...new Set(
      [mTw, mLw, mLy, tTw, tLw, tLy].flatMap((m) => Object.keys(m)).map(Number),
    ),
  ];

  const money = (m: Record<number, Side>, id: number) => m[id]?.money ?? 0;

  return ids.map((id) => {
    const mine = mTw[id];
    const theirs = tTw[id];
    // Weight only counts as the unit when BOTH sides ring by it. One store
    // weighing and the other not is a data oddity, and comparing pounds
    // against lines would be worse than comparing lines against lines.
    const weighed = (mine?.weight ?? 0) > 0 && (theirs?.weight ?? 0) > 0;
    const units = (s?: Side) => (weighed ? (s?.weight ?? 0) : (s?.qty ?? 0));

    return {
      id,
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
