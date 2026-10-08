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

/** Where in the items the evidence for this shape lives. It points; it does
 *  not filter — a department can be all volume with no item flagged never
 *  ordered, and that disagreement is itself worth seeing. */
export type Focus = "orders" | "price" | "unknown";

export const focusOf = (s: Split | null): Focus =>
  s === null ? "unknown" : Math.abs(s.volume) >= Math.abs(s.rate) ? "orders" : "price";

/**
 * The two effects as one sentence.
 *
 * A side under a tenth of the other is not a finding: saying "and took
 * slightly less per unit" about $166 against $6,635 sends somebody to look at
 * a price that is fine.
 */
export const sentenceFor = (
  d: DeptTotals,
  s: Split | null,
  them: string,
): string => {
  const unit = d.weighed ? "lb" : "units";
  const one = d.weighed ? "pound" : "unit";
  const n = (v: number) => Math.round(v).toLocaleString("en-US");

  if (s === null) {
    return `${them} sold none of this department, so there is nothing to compare it against.`;
  }

  const unitGap = d.mineUnits - d.theirsUnits;
  const small = (a: number, b: number) => Math.abs(a) < Math.abs(b) * 0.1;

  const first = small(s.volume, s.rate)
    ? `Sold much the same ${d.weighed ? "weight" : "volume"} as ${them}`
    : `Sold ${n(Math.abs(unitGap))} ${unitGap < 0 ? "fewer" : "more"} ${unit} than ${them}`;

  const second = small(s.rate, s.volume)
    ? `at much the same take per ${one}`
    : `${s.volume * s.rate < 0 ? "but took" : "and took"} ${
        s.rate < 0 ? "less" : "more"
      } for every ${one} it did sell`;

  return `${first}, ${second}.`;
};

export interface ReportRow extends DeptTotals {
  gap: number;
  split: Split | null;
  says: string;
  focus: Focus;
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
  underTotal: number;
  overTotal: number;
  /** Under netted against over — the figure the Stores tab shows. */
  netGap: number;
  /** What the printed departments account for, 0–1. */
  shownShare: number;
}

const rowOf = (d: DeptTotals, them: string): ReportRow => {
  const split = splitGap(d);
  return {
    ...d,
    gap: d.mine - d.theirs,
    split,
    says: sentenceFor(d, split, them),
    focus: focusOf(split),
    dropoff: d.theirs > 0 ? (d.theirs - d.mine) / d.theirs : 0,
  };
};

export const buildReport = (
  depts: DeptTotals[],
  them: string,
  bands: Bands = DEFAULT_BANDS,
): Report => {
  const rows = depts.map((d) => rowOf(d, them));
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

  return {
    under,
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
