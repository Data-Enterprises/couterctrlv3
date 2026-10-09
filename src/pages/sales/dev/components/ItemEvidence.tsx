import {
  ladderFor,
  CAUSE_LABEL,
  CAUSE_TONE,
  evidenceSays,
  supplyTimeline,
  type ItemVerdict,
  type PriceLadder,
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

const Ladder = ({
  ladder,
  tint,
  label,
}: {
  ladder: PriceLadder;
  tint: string;
  label: string;
}) => (
  <div className="min-w-0">
    <div className={`flex items-baseline gap-2 text-[13px] font-semibold uppercase tracking-wide text-content/85 pb-1.5 border-b-2 leading-tight ${tint}`}>
      <span className="min-w-0">{label}</span>
      {ladder.promo && (
        <span className="text-[12px] font-bold px-1.5 py-0.5 rounded bg-delta_positive_bg text-delta_positive_text normal-case tracking-normal">
          Promotion
        </span>
      )}
    </div>

    {ladder.points.length === 0 ? (
      <p className="text-[12px] text-content/85 pt-2.5">Nothing rang this week.</p>
    ) : (
      <>
        {ladder.points.map((p) => (
          <div key={p.price} className="py-2 border-b border-brand_navy/15">
            <div className="flex items-baseline gap-2">
              <span className="text-[16px] font-bold tabular-nums text-content">
                {money(p.price)}
              </span>
              <span className="ml-auto text-[13.5px] text-content/85 tabular-nums">
                {count(p.units)} units · {p.days}d
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1 text-[13.5px] text-content/85 tabular-nums">
              <span>{count(p.transactions)} baskets</span>
              {/* Units over baskets is the one figure only the transaction
                  count can give, and it is how a multi-buy shows itself. */}
              <span
                className={`ml-auto font-semibold ${
                  (p.unitsPerBasket ?? 0) >= 1.5
                    ? "text-delta_positive_text"
                    : "text-content"
                }`}
              >
                {p.unitsPerBasket === null ? "—" : p.unitsPerBasket.toFixed(2)} per basket
              </span>
            </div>
          </div>
        ))}

        {/* The contrast that justifies the whole payload: on two prices the
            average is a figure nobody ever paid. */}
        {ladder.points.length > 1 && ladder.blended !== null && (
          <div className="mt-2 rounded bg-severity_watch_bg text-severity_watch_text px-2.5 py-2">
            <div className="text-[12px] font-bold uppercase tracking-wide">
              An average would say
            </div>
            <div className="text-[14px] font-bold tabular-nums mt-0.5">
              {money(ladder.blended)}
            </div>
            <div className="text-[13px] mt-0.5 leading-snug">
              A price no customer paid. It rang at{" "}
              {ladder.points.map((p) => money(p.price)).join(" and ")}.
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

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
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="rounded-lg bg-custom-white shadow-card-sm px-3.5 py-3">
          <span
            className={`inline-block text-[11.5px] font-bold px-2 py-0.5 rounded ${CAUSE_TONE[item.cause].chip}`}
          >
            {CAUSE_LABEL[item.cause]}
          </span>
          <p className="text-[13.5px] leading-snug text-content mt-1.5">
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
          <div className="grid grid-cols-2 gap-4">
            <Ladder ladder={mineLadder} tint={MINE} label={openStoreName} />
            <Ladder ladder={theirLadder} tint={THEIRS} label={compareStoreName} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ItemEvidence;
