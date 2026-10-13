import { useState, type ReactNode } from "react";
import {
  ladderFor,
  ladderSays,
  CAUSE_LABEL,
  CAUSE_TONE,
  evidenceSays,
  supplyTimeline,
  type ItemVerdict,
  type PriceLadder,
  type PricePoint,
  type SupplyEvent,
} from "../shared/deptInvestigation";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import type {
  AllOrder,
  ReceiverItemSearchReceiver,
  SubsPricePoint,
} from "../../../../interfaces";

/**
 * The evidence behind one item's cause.
 *
 * The grid says "Didn't arrive". Until somebody can see an order on the 22nd
 * with nothing against it, that is a label they have to take on trust — so
 * this is not a decoration, it is the proof, and it is the only place on the
 * page where the two stores' supply sits side by side.
 *
 * Two halves, because the causes split along the same line:
 *
 *   The timeline  — ordered, received, in date order, both stores. Answers
 *                   never-ordered and didn't-arrive.
 *   The ladder    — every price the item actually RANG at, with the units and
 *                   the baskets behind each. Answers price / mix, and does it
 *                   with figures an average destroys.
 *
 * Above both, the money: sold for, cost to buy, and what was actually kept.
 * It leads because it is the only part that can contradict the grid — an item
 * can be ahead on every sales column and still be losing money, and somebody
 * who reads the supply timeline first has already decided there is nothing
 * wrong with it.
 *
 * Everything here is computed in `shared/deptInvestigation`. Nothing is
 * fetched: all three payloads were already in hand when the grid drew.
 */

interface Props {
  item: ItemVerdict;
  /** The names, not the numbers. Both halves of the rail are two columns of
   *  figures and a bare "15" over one of them is a legend the reader has to
   *  go and find; the name already carries the number. */
  openStoreName: string;
  compareStoreName: string;
  mineOrders: AllOrder[];
  theirsOrders: AllOrder[];
  mineReceipts: ReceiverItemSearchReceiver[];
  theirsReceipts: ReceiverItemSearchReceiver[];
  minePoints: SubsPricePoint[];
  theirsPoints: SubsPricePoint[];
  /** False while the receipt walk is still running, so an empty timeline can
   *  say "still reading" instead of "nothing was ever delivered" — which are
   *  opposite answers. */
  supplyReady: boolean;
  /** Where this item sits in the list the grid is currently showing, so
   *  stepping through a filtered pile does not quietly walk out of it. */
  position: { at: number; of: number; within: string | null };
  onStep: (delta: number) => void;
  onClose: () => void;
}

const money = (v: number) => formatCurrency2(v);
const count = (v: number) => formatBigNumber(v, 0);

/**
 * Sold for, cost to buy, kept.
 *
 * Three pairs rather than one margin figure, because the question is which of
 * the three is doing the damage. A single "margin: down $42" sends somebody
 * to look at the shelf price, when the shelf price was fine and the invoice
 * was not.
 */
/** A figure the store does not have. Dashes rather than $0.00, which is a
 *  measurement and this is an absence. */
const NONE = "—";

/**
 * The item, both stores, one table.
 *
 * It used to be three pairs of tinted boxes stacked down the panel: six
 * figures in six frames, with the reader doing the subtraction. One row a
 * measure puts the pair side by side and prints the difference, which is
 * the number the panel exists to explain.
 */
const SideBySide = ({
  item,
  mine,
  theirs,
}: {
  item: ItemVerdict;
  mine: string;
  theirs: string;
}) => {
  const m = item.margins;
  const noCost = item.mineCogs === 0 && item.theirsCogs === 0;

  const rows: {
    label: string;
    us: string;
    them: string;
    gap: number | null;
  }[] = [
    {
      label: "Sold for",
      us: money(item.mineSales),
      them: money(item.theirsSales),
      gap: item.mineSales - item.theirsSales,
    },
    {
      label: "Cost per unit",
      us: m.minePerUnit === null ? NONE : money(m.minePerUnit),
      them: m.theirsPerUnit === null ? NONE : money(m.theirsPerUnit),
      // Dearer is worse, so the sign is flipped: paying MORE is the gap.
      gap:
        m.minePerUnit === null || m.theirsPerUnit === null
          ? null
          : m.theirsPerUnit - m.minePerUnit,
    },
    {
      label: "Made",
      us: noCost ? NONE : money(m.mine),
      them: noCost ? NONE : money(m.theirs),
      gap: noCost ? null : m.diff,
    },
  ];

  return (
    <div className="rounded-lg bg-custom-white shadow-card-sm overflow-hidden">
      <div
        className="grid gap-x-3 px-3 pt-2.5 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/85"
        style={{ gridTemplateColumns: "minmax(0,1fr) 84px 84px 84px" }}
      >
        <span />
        <span className="flex items-center justify-end gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-store_open flex-shrink-0" />
          {mine}
        </span>
        <span className="flex items-center justify-end gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-store_compare flex-shrink-0" />
          {theirs}
        </span>
        <span className="text-right">Gap</span>
      </div>

      {rows.map((r) => (
        <div
          key={r.label}
          className="grid gap-x-3 px-3 py-2 border-b border-brand_navy/15 last:border-b-0 text-[13.5px]"
          style={{ gridTemplateColumns: "minmax(0,1fr) 84px 84px 84px" }}
        >
          <span className="text-content/85 truncate">{r.label}</span>
          <span className="text-right tabular-nums font-semibold text-content bg-store_open_tint/50 -my-2 py-2 px-1">
            {r.us}
          </span>
          <span className="text-right tabular-nums font-semibold text-content">
            {r.them}
          </span>
          <span
            className={`text-right tabular-nums font-bold ${
              r.gap === null
                ? "text-content/85"
                : r.gap < 0
                  ? "text-delta_negative_text"
                  : r.gap > 0
                    ? "text-delta_positive_text"
                    : "text-content"
            }`}
          >
            {r.gap === null
              ? NONE
              : (r.gap < 0 ? "−" : r.gap > 0 ? "+" : "") + money(Math.abs(r.gap))}
          </span>
        </div>
      ))}

      {noCost && (
        <p className="px-3 py-2 text-[12px] text-content/85 leading-snug border-t border-brand_navy/15">
          No cost came through on either store&rsquo;s lines this week, so what
          this item makes cannot be said.
        </p>
      )}
    </div>
  );
};

const EVENT_CLASS: Record<SupplyEvent["kind"], string> = {
  ordered: "bg-gray-100 text-content",
  received: "bg-delta_positive_bg text-delta_positive_text",
};

const Timeline = ({
  events,
  ready,
  tint,
  label,
}: {
  events: SupplyEvent[];
  ready: boolean;
  tint: string;
  label: string;
}) => (
  <div className="min-w-0">
    <div className={`text-[13px] font-semibold uppercase tracking-wide text-content/85 pb-1.5 border-b-2 leading-tight ${tint}`}>
      {label}
    </div>

    {events.length === 0 ? (
      <p className="text-[12px] text-content/85 leading-relaxed pt-2.5">
        {ready ? (
          <>
            Nothing ordered and nothing received in the window.{" "}
            <span className="font-semibold">That is the finding</span>, not a
            gap in the data.
          </>
        ) : (
          "Still reading deliveries…"
        )}
      </p>
    ) : (
      events.map((e, i) => (
        <div
          key={`${e.date}__${e.kind}__${i}`}
          className="py-2 border-b border-brand_navy/15 last:border-b-0"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-brand_slate w-[52px] flex-shrink-0">
              {e.date.slice(5)}
            </span>
            <span className={`text-[12px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${EVENT_CLASS[e.kind]}`}>
              {e.kind}
            </span>
            <span className="ml-auto text-[12.5px] font-semibold tabular-nums text-content">
              {count(e.amount)} {e.unit}
            </span>
          </div>
          {e.detail && (
            <div className="text-[13px] text-content/85 mt-1 ml-[60px] truncate" title={e.detail}>
              {e.detail}
            </div>
          )}
        </div>
      ))
    )}
  </div>
);

/**
 * Units sold at each price, in ten-cent steps.
 *
 * The ladder is exact and unshaped: thirteen rows, and the fact that four
 * fifths of the units went inside one dime takes adding up to see. Binned,
 * that shape is the picture — one tall bar and a scatter of stubs either
 * side, or two towers, which is a different week entirely.
 *
 * Bars are units, not money: the question is what customers actually paid,
 * and money would make a dear price with three sales look like a busy one.
 */
const PriceChart = ({
  points,
  weighed,
  rate,
}: {
  points: PricePoint[];
  weighed: boolean;
  rate: number | null;
}) => {
  if (points.length < 2) return null;

  /* A bar is how much went out at that price. On a scale item that is pounds,
     derived the same way the rows are — a bar counting rings would say four
     packages were four of something, when one of them was three times another. */
  const amount = (pt: PricePoint) =>
    weighed ? (poundsAt(pt.netSales, rate) ?? pt.units) : pt.units;

  const bins = new Map<number, number>();
  for (const p of points) {
    const k = Math.round(Math.floor(p.price * 10 + 1e-9)) / 10;
    bins.set(k, (bins.get(k) ?? 0) + amount(p));
  }
  const keys = [...bins.keys()].sort((x, y) => x - y);
  const lo = keys[0];
  const hi = keys[keys.length - 1] + 0.1;
  const tallest = Math.max(...bins.values());
  const widest = points.reduce(
    (m, p) => (amount(p) > amount(m) ? p : m),
    points[0],
  );
  const hot = Math.round(Math.floor(widest.price * 10 + 1e-9)) / 10;

  const W = 440;
  const H = 96;
  const base = H - 18;
  const span = Math.max(0.1, hi - lo);
  const at = (p: number) => ((p - lo) / span) * W;
  const bw = Math.max(3, (W / (span * 10)) - 2);

  /* Four marks across, whatever the span: a tick a bin would be forty of
     them on a department that rings in cents. */
  const ticks = [0, 1, 2, 3].map((i) => lo + (span * i) / 3);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Units sold at each price, in ten-cent steps. Most at ${money(widest.price)}.`}
    >
      <line x1={0} x2={W} y1={base} y2={base} className="stroke-brand_navy/20" />
      {keys.map((k) => {
        const u = bins.get(k) ?? 0;
        const h = Math.max(2, (u / tallest) * (base - 6));
        return (
          <rect
            key={k}
            x={at(k) + 1}
            y={base - h}
            width={bw}
            height={h}
            rx={2}
            className={k === hot ? "fill-brand_navy" : "fill-brand_navy/35"}
          >
            <title>
              {money(k)}–{money(k + 0.09)} ·{" "}
              {weighed
                ? `${u.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} lb`
                : `${count(u)} ea`}
            </title>
          </rect>
        );
      })}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={Math.min(W - 2, Math.max(2, at(t)))}
          y={H - 4}
          textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"}
          className="fill-content/85 text-[9px]"
        >
          {money(t)}
        </text>
      ))}
    </svg>
  );
};

/**
 * The pounds behind one price point.
 *
 * The price-points endpoint carries no weight column, so this is derived:
 * the money that rang at this price, over what the item took per pound across
 * the week. On a scale item that is the figure the reader is actually after —
 * $9.59 of sirloin is a package, and the question is how much sirloin.
 *
 * Exact while the shelf rate held, which is the normal case. It drifts in
 * proportion to a mid-week price change, and the per-pound rate it divides by
 * is printed above the ladder so the arithmetic is in view rather than hidden.
 *
 * Null when the rate is unknowable — a store that rang none of it has no rate
 * to divide by, and a guess there would be a number with nothing behind it.
 */
const poundsAt = (netSales: number, ratePerUnit: number | null) =>
  ratePerUnit === null || ratePerUnit <= 0 ? null : netSales / ratePerUnit;

/**
 * What one basket carried away at this price.
 *
 * Pounds over baskets on a scale item, units over baskets otherwise. Falls
 * back to the endpoint's own figure when there is no rate, which is the same
 * thing for an item sold by the each.
 */
const perBasket = (p: PricePoint, weighed: boolean, rate: number | null) => {
  if (!weighed) return p.unitsPerBasket;
  const lb = poundsAt(p.netSales, rate);
  if (lb === null || p.transactions <= 0) return p.unitsPerBasket;
  return lb / p.transactions;
};

/** "12.47 lb", or the ring count when there is no rate to divide by. */
const weightLabel = (p: PricePoint, rate: number | null) => {
  const lb = poundsAt(p.netSales, rate);
  if (lb === null)
    return `${count(p.units)} ${p.units === 1 ? "ring" : "rings"}`;
  return `${lb.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} lb`;
};

/** One price, and what went out at it. */
const Rung = ({
  p,
  weighed,
  rate,
}: {
  p: PricePoint;
  weighed: boolean;
  /** What the item took per pound this week, for deriving the weight. */
  rate: number | null;
}) => (
  <div className="flex items-baseline gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0">
    <span className="w-[62px] flex-shrink-0 text-[15px] font-bold tabular-nums text-content">
      {money(p.price)}
    </span>
    <span className="min-w-0 flex-1 text-[12px] text-content/85 tabular-nums truncate">
      {weighed ? weightLabel(p, rate) : `${count(p.units)} ea`} · {p.days}d ·{" "}
      {count(p.transactions)} baskets
    </span>
    {/*
      What one customer carried out, which only the transaction count can give.

      On a scale item that has to be POUNDS over baskets, not rings over
      baskets — the latter is 1.00 on every row of every weighted item, since
      one package is one scan, and a column that always reads 1.00 is a column
      saying nothing.
    */}
    <span
      className={`flex-shrink-0 text-right text-[12px] tabular-nums ${
        (perBasket(p, weighed, rate) ?? 0) >= 1.5
          ? "font-bold text-delta_positive_text"
          : "text-content/85"
      }`}
    >
      {perBasket(p, weighed, rate) === null
        ? "—"
        : `${(perBasket(p, weighed, rate) as number).toFixed(2)}${
            weighed ? " lb" : ""
          } per basket`}
    </span>
  </div>
);

/** How many prices print before the rest folds away. */
const LADDER_SHOWN = 4;

const Ladder = ({
  ladder,
  label,
  mine,
  rate,
}: {
  ladder: PriceLadder;
  label: string;
  mine: boolean;
  /** This store's take per pound across the week. Null when it rang none. */
  rate: number | null;
}) => {
  const [all, setAll] = useState(false);

  if (ladder.points.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-content/85">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span className="font-semibold text-content">{label}</span>
        rang none of it this week.
      </p>
    );
  }

  /* Biggest first. The ladder was in price order, which puts the price that
     sold three units above the one that sold a hundred and thirty-five as
     often as not. */
  /*
     NOT pounds. These points carry no weight column — that absence is the
     whole reason the weighted flag exists — so `units` here is the number of
     times the item was SCANNED, and one scan of sirloin is whatever the
     package happened to weigh. Labelling it "lb" said a pound was sold and
     made a 1.7 lb ring read as 1 lb. The sentence above the ladder already
     counts these as rings; this agrees with it.
  */

  /* Biggest first, by what the rows actually print: on a scale item the
     price that moved the most POUNDS leads, not the one scanned most often. */
  const weightOf = (pt: PricePoint) =>
    ladder.weighted ? (poundsAt(pt.netSales, rate) ?? pt.units) : pt.units;
  const byUnits = [...ladder.points].sort((x, y) => weightOf(y) - weightOf(x));
  const shown = all ? byUnits : byUnits.slice(0, LADDER_SHOWN);
  const says = ladderSays(ladder);

  return (
    <div className="rounded-lg bg-custom-white shadow-card-sm px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span className="min-w-0 truncate text-[13px] font-bold text-content">
          {label}
        </span>
        {ladder.promo && (
          <span className="flex-shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded bg-delta_positive_bg text-delta_positive_text">
            Promotion
          </span>
        )}
        {/* Where the Promotion chip would have been. A scale item rings a
            different total on every package, so the old chip fired on all of
            them — this says what the spread actually is. */}
        {ladder.weighted && (
          <span className="flex-shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text">
            By weight
          </span>
        )}
      </div>

      {says && (
        <p className="text-[12.5px] leading-snug text-content/85 mt-1.5">{says}</p>
      )}

      <div className="mt-2">
        <PriceChart
          points={ladder.points}
          weighed={ladder.weighted}
          rate={rate}
        />
      </div>

      <div className="mt-1">
        {shown.map((p) => (
          <Rung key={p.price} p={p} weighed={ladder.weighted} rate={rate} />
        ))}
      </div>

      {byUnits.length > LADDER_SHOWN && (
        <button
          onClick={() => setAll((v) => !v)}
          className="mt-1.5 text-[12px] font-bold text-brand_navy_hover hover:underline"
        >
          {all
            ? "Show fewer"
            : `Show all ${byUnits.length} prices`}
        </button>
      )}

      {/* The contrast that justifies the whole payload: on two prices the
          average is a figure nobody ever paid. */}
      {ladder.points.length > 1 && ladder.blended !== null && (
        <p className="mt-2 rounded-md bg-severity_watch_bg text-severity_watch_text px-2.5 py-1.5 text-[12px] leading-snug">
          An average would call it{" "}
          <span className="font-bold tabular-nums">{money(ladder.blended)}</span>{" "}
          — a price no customer paid.
        </p>
      )}
    </div>
  );
};

/**
 * A section that folds.
 *
 * The panel is four sections deep and a reader chasing one of them should
 * not scroll past the other three every time. Open by default: a panel of
 * shut drawers makes somebody open all four to find out what is in them.
 */
const Fold = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    /* A seam between sections, not a frame around them: at /15 and above
       it ruled the panel into boxes and competed with the figures. */
    <section className="pt-3 mt-3 border-t border-brand_navy/10 first:border-t-0 first:mt-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left group"
      >
        <span className="text-[12px] font-bold uppercase tracking-wide text-content/85 group-hover:text-content transition-colors">
          {title}
        </span>
        <span className="ml-auto flex-shrink-0 text-[10px] text-content/85">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
};

const ItemEvidence = ({
  item,
  openStoreName,
  compareStoreName,
  mineOrders,
  theirsOrders,
  mineReceipts,
  theirsReceipts,
  minePoints,
  theirsPoints,
  supplyReady,
  position,
  onStep,
  onClose,
}: Props) => {
  const code = item.productCode;
  const mineEvents = supplyTimeline(code, mineOrders, mineReceipts);
  const theirEvents = supplyTimeline(code, theirsOrders, theirsReceipts);
  /* Closed. It lays over the sections below it, so opening with it down
     would cover the first thing the panel has to show — and a reader who
     clicked an item already knows which item they clicked. "View details"
     brings it back. */
  const [says, setSays] = useState(false);
  /* Weighted items have no price ladder to read: the price-points endpoint
     divides money by scan count, which is 1 on a scale item, so each "price"
     is what one package totalled. The flag stops the ladder claiming
     otherwise and stops every scale item flagging a promotion. */
  /* Money over pounds, each store's own. `mineSales` rather than `mineTy`
     because the page's Qty mode makes `mineTy` a unit count, and a rate of
     pounds per pound is not a rate. */
  const mineRate =
    item.mineUnits > 0 ? item.mineSales / item.mineUnits : null;
  const theirsRate =
    item.theirsUnits > 0 ? item.theirsSales / item.theirsUnits : null;

  const mineLadder = ladderFor(minePoints, code, undefined, item.weighted);
  const theirLadder = ladderFor(theirsPoints, code, undefined, item.weighted);

  const MINE = "border-b-store_open";
  const THEIRS = "border-b-store_compare";

  return (
    <div className="w-[520px] h-full flex-shrink-0 flex flex-col overflow-hidden bg-custom-white border-l border-brand_navy/15">
      {/* One header, in the cause's own colour.

          A white bar with a tinted card slung under it read as two headers
          with a seam between them — and the seam fell between the item's
          name and the sentence about that item, which belong together. The
          cause is what the panel is about, so the panel's head wears it. */}
      <div
        className={`relative z-20 flex-shrink-0 px-4 py-3 border-b border-brand_navy/15 ${CAUSE_TONE[item.cause].chip}`}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <div className="text-[14px] font-bold leading-snug">
              {item.description}
            </div>
            <div className="text-[12.5px] opacity-80 mt-0.5 truncate">
              {code}
              {item.vendorName ? ` · ${item.vendorName}` : ""}
            </div>
          </div>
          {/* Walking the pile beats going back to the grid for every item.
              The arrows follow whatever the grid is filtered to, and the
              count says which pile that is. */}
          <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
            <span className="text-[12px] opacity-80 tabular-nums whitespace-nowrap mr-1">
              {position.at + 1} of {position.of.toLocaleString("en-US")}
            </span>
            {/* Borders and hovers off the inherited ink, so the controls
                belong to whichever colour the cause brought with it. */}
            <button
              onClick={() => onStep(-1)}
              disabled={position.at <= 0}
              aria-label="Previous item"
              className="w-7 h-7 rounded border border-current/25 hover:bg-current/10 disabled:opacity-40 transition-colors"
            >
              &lsaquo;
            </button>
            <button
              onClick={() => onStep(1)}
              disabled={position.at >= position.of - 1}
              aria-label="Next item"
              className="w-7 h-7 rounded border border-current/25 hover:bg-current/10 disabled:opacity-40 transition-colors"
            >
              &rsaquo;
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded text-[12px] font-semibold hover:bg-current/10 transition-colors"
            >
              ✕
            </button>
            </div>

            {/* Words, not a chevron. A caret beside a close button is one
                more unlabelled glyph in a row of them, and this one hides
                the sentence the panel opens with. */}
            <button
              onClick={() => setSays((v) => !v)}
              aria-expanded={says}
              className="text-[11.5px] font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {says ? "Hide details" : "View details"}
            </button>
          </div>
        </div>

        {/* What the grid's Cause column means, spelled out. A label is a
            claim; this says what each store did. */}
        {/* Over the sections, not above them. Opening it pushed three
            headings down the panel, so the thing a reader had their eye on
            moved every time they asked what the cause was. */}
        {says && (
          <div
            className={`absolute top-full left-0 right-0 px-4 py-2.5 border-b border-brand_navy/15 shadow-card ${CAUSE_TONE[item.cause].chip}`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wide">
              {CAUSE_LABEL[item.cause]}
            </span>
            <p className="text-[13.5px] leading-snug mt-1">
              {evidenceSays(item, openStoreName, compareStoreName)}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 pb-4">
        <Fold title="Side by side">
          <SideBySide item={item} mine={openStoreName} theirs={compareStoreName} />
        </Fold>

        <Fold title="Ordered, then received">
          {/* One line when there is nothing on either side. Two empty
              timelines side by side took a third of the panel to say
              nothing twice. */}
          {supplyReady && mineEvents.length === 0 && theirEvents.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-content/85 rounded-lg bg-bkg px-3.5 py-3">
              <span className="font-semibold text-content">
                Neither store ordered or received it
              </span>{" "}
              in the window. That is the finding, not a gap in the data.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Timeline events={mineEvents} ready={supplyReady} tint={MINE} label={openStoreName} />
              <Timeline events={theirEvents} ready={supplyReady} tint={THEIRS} label={compareStoreName} />
            </div>
          )}
        </Fold>

        <Fold title="What it actually rang at">
          {/* One above the other. Side by side each card had half a
              panel for a chart, a ladder and a sentence, and the store
              that rang nothing still took its half to say so. */}
          <div className="flex flex-col gap-3">
            <Ladder
              ladder={mineLadder}
              label={openStoreName}
              mine
              rate={mineRate}
            />
            <Ladder
              ladder={theirLadder}
              label={compareStoreName}
              mine={false}
              rate={theirsRate}
            />
          </div>
        </Fold>
      </div>
    </div>
  );
};

export default ItemEvidence;
