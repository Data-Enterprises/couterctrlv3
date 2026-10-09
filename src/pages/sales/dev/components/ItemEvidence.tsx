import { useState } from "react";
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
const PriceChart = ({ points }: { points: PricePoint[] }) => {
  if (points.length < 2) return null;

  const bins = new Map<number, number>();
  for (const p of points) {
    const k = Math.round(Math.floor(p.price * 10 + 1e-9)) / 10;
    bins.set(k, (bins.get(k) ?? 0) + p.units);
  }
  const keys = [...bins.keys()].sort((x, y) => x - y);
  const lo = keys[0];
  const hi = keys[keys.length - 1] + 0.1;
  const tallest = Math.max(...bins.values());
  const widest = points.reduce((m, p) => (p.units > m.units ? p : m), points[0]);
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
              {money(k)}–{money(k + 0.09)} · {count(u)} units
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

/** One price, and what went out at it. */
const Rung = ({ p }: { p: PricePoint }) => (
  <div className="flex items-baseline gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0">
    <span className="w-[62px] flex-shrink-0 text-[15px] font-bold tabular-nums text-content">
      {money(p.price)}
    </span>
    <span className="min-w-0 flex-1 text-[12px] text-content/85 tabular-nums truncate">
      {count(p.units)} units · {p.days}d · {count(p.transactions)} baskets
    </span>
    {/* Units over baskets is the one figure only the transaction count can
        give, and it is how a multi-buy shows itself. */}
    <span
      className={`flex-shrink-0 text-right text-[12px] tabular-nums ${
        (p.unitsPerBasket ?? 0) >= 1.5
          ? "font-bold text-delta_positive_text"
          : "text-content/85"
      }`}
    >
      {p.unitsPerBasket === null ? "—" : `${p.unitsPerBasket.toFixed(2)} per basket`}
    </span>
  </div>
);

/** How many prices print before the rest folds away. */
const LADDER_SHOWN = 4;

const Ladder = ({
  ladder,
  label,
  mine,
}: {
  ladder: PriceLadder;
  label: string;
  mine: boolean;
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
  const byUnits = [...ladder.points].sort((x, y) => y.units - x.units);
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
      </div>

      {says && (
        <p className="text-[12.5px] leading-snug text-content/85 mt-1.5">{says}</p>
      )}

      <div className="mt-2">
        <PriceChart points={ladder.points} />
      </div>

      <div className="mt-1">
        {shown.map((p) => (
          <Rung key={p.price} p={p} />
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
  const mineLadder = ladderFor(minePoints, code);
  const theirLadder = ladderFor(theirsPoints, code);

  const MINE = "border-b-store_open";
  const THEIRS = "border-b-store_compare";

  return (
    <div className="w-[520px] h-full flex-shrink-0 flex flex-col overflow-hidden bg-custom-white border-l border-brand_navy/15">
      <div className="flex-shrink-0 px-4 py-3 border-b border-brand_navy/15">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-content leading-snug">
              {item.description}
            </div>
            <div className="text-[13.5px] text-brand_slate mt-0.5 truncate">
              {code}
              {item.vendorName ? ` · ${item.vendorName}` : ""}
            </div>
          </div>
          {/* Walking the pile beats going back to the grid for every item.
              The arrows follow whatever the grid is filtered to, and the
              count says which pile that is. */}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <span className="text-[12px] text-content/85 tabular-nums whitespace-nowrap mr-1">
              {position.at + 1} of {position.of.toLocaleString("en-US")}
            </span>
            <button
              onClick={() => onStep(-1)}
              disabled={position.at <= 0}
              aria-label="Previous item"
              className="w-7 h-7 rounded border border-brand_line text-content/85 hover:text-content hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              &lsaquo;
            </button>
            <button
              onClick={() => onStep(1)}
              disabled={position.at >= position.of - 1}
              aria-label="Next item"
              className="w-7 h-7 rounded border border-brand_line text-content/85 hover:text-content hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              &rsaquo;
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded text-[12px] font-semibold text-content/85 hover:text-content hover:bg-gray-50 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* What the grid's Cause column means, spelled out. A label is a
          claim; this says what each store did. */}
      {/* The card wears the cause it names. A white card with a coloured
          chip on it made the colour a label ABOUT the verdict; the verdict
          is the thing that has a colour, and it is the same one the row in
          the grid behind is wearing. */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className={`rounded-lg px-3.5 py-3 ${CAUSE_TONE[item.cause].chip}`}>
          <span className="text-[11px] font-bold uppercase tracking-wide">
            {CAUSE_LABEL[item.cause]}
          </span>
          <p className="text-[13.5px] leading-snug mt-1">
            {evidenceSays(item, openStoreName, compareStoreName)}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 pb-4">
        <h3 className="text-[12px] font-bold uppercase tracking-wide text-content/85 mb-2">
          Side by side
        </h3>
        <SideBySide item={item} mine={openStoreName} theirs={compareStoreName} />

        <section className="pt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-content/85 mb-2">
            Ordered, then received
          </h3>
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
        </section>

        <section className="pt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-content/85 mb-2">
            What it actually rang at
          </h3>
          {/* One above the other. Side by side each card had half a
              panel for a chart, a ladder and a sentence, and the store
              that rang nothing still took its half to say so. */}
          <div className="flex flex-col gap-3">
            <Ladder ladder={mineLadder} label={openStoreName} mine />
            <Ladder ladder={theirLadder} label={compareStoreName} mine={false} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ItemEvidence;
