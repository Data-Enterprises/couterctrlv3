import {
  ladderFor,
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
  onClose: () => void;
}

const money = (v: number) => formatCurrency2(v);
const count = (v: number) => formatBigNumber(v, 0);

/** One figure in a tinted box, in the colour of the store it belongs to. */
const Figure = ({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) => (
  <div className={`rounded-md px-2.5 py-2 min-w-0 ${tint}`}>
    <div className="text-[12px] font-bold uppercase tracking-wide text-content/85 leading-tight">
      {label}
    </div>
    <div className="text-[15px] font-bold tabular-nums text-content mt-0.5">
      {value}
    </div>
  </div>
);

/**
 * Sold for, cost to buy, kept.
 *
 * Three pairs rather than one margin figure, because the question is which of
 * the three is doing the damage. A single "margin: down $42" sends somebody
 * to look at the shelf price, when the shelf price was fine and the invoice
 * was not.
 */
const Money = ({
  item,
  mine,
  theirs,
}: {
  item: ItemVerdict;
  mine: string;
  theirs: string;
}) => {
  const m = item.margins;
  const MINE_BG = "bg-store_open_tint";
  const THEIRS_BG = "bg-store_compare_tint";

  // No cost on either store's lines is not a finding of equal margins — it
  // is no answer at all, and three pairs of boxes repeating the sales figure
  // would say the opposite.
  if (item.mineCogs === 0 && item.theirsCogs === 0) {
    return (
      <section className="pt-3">
        <h3 className="text-[12px] font-bold text-content mb-2">
          What it cost to buy
        </h3>
        <p className="text-[12.5px] text-content/85 leading-relaxed">
          No cost came through on either store&rsquo;s lines this week, so what
          this item makes cannot be said.
        </p>
      </section>
    );
  }

  const perUnit =
    m.minePerUnit !== null && m.theirsPerUnit !== null
      ? m.minePerUnit - m.theirsPerUnit
      : null;
  // A hundredth of a cent either way is rounding in the data, not a buy.
  const dearer = perUnit !== null && perUnit > 0.0001;
  const cheaper = perUnit !== null && perUnit < -0.0001;
  // Money, not the page's metric — `item.gap` follows the Sales/Quantity
  // toggle and this sentence is about dollars.
  const salesGap = item.mineSales - item.theirsSales;

  return (
    <>
      <section className="pt-3">
        <h3 className="text-[12px] font-bold text-content mb-2">
          What it sold for
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Figure label={mine} value={money(item.mineSales)} tint={MINE_BG} />
          <Figure label={theirs} value={money(item.theirsSales)} tint={THEIRS_BG} />
        </div>
      </section>

      <section className="pt-4">
        <h3 className="text-[12px] font-bold text-content mb-2">
          What it cost to buy, per unit
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Figure
            label={mine}
            value={m.minePerUnit === null ? "—" : money(m.minePerUnit)}
            tint={MINE_BG}
          />
          <Figure
            label={theirs}
            value={m.theirsPerUnit === null ? "—" : money(m.theirsPerUnit)}
            tint={THEIRS_BG}
          />
        </div>

        {/* The per-unit difference, said in money on the units that actually
            sold. A percentage here hides how much of it there was. */}
        {(dearer || cheaper) && perUnit !== null && (
          <p
            className={`mt-2 rounded px-2.5 py-2 text-[12.5px] leading-snug ${
              dearer
                ? "bg-severity_watch_bg text-severity_watch_text"
                : "bg-delta_positive_bg text-delta_positive_text"
            }`}
          >
            {mine} pays{" "}
            <span className="font-bold">
              {money(Math.abs(perUnit))} {dearer ? "more" : "less"}
            </span>{" "}
            a unit. On the {count(item.mineUnits)} units it sold, that is{" "}
            <span className="font-bold">
              {money(Math.abs(m.costPenalty ?? 0))}
            </span>{" "}
            {dearer
              ? "of margin gone before anything else happened."
              : "of margin earned on the buy alone."}
          </p>
        )}
      </section>

      <section className="pt-4">
        <h3 className="text-[12px] font-bold text-content mb-2">
          What it actually made
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Figure label={mine} value={money(m.mine)} tint={MINE_BG} />
          <Figure label={theirs} value={money(m.theirs)} tint={THEIRS_BG} />
        </div>

        {/* The case the grid cannot make on its own. */}
        {salesGap > 0 && m.diff < 0 && (
          <p className="mt-2 rounded px-2.5 py-2 bg-severity_watch_bg text-severity_watch_text text-[12.5px] leading-snug">
            <span className="font-bold">Ahead on sales, behind on margin.</span>{" "}
            {mine} sold {money(salesGap)} more of this and still made{" "}
            {money(Math.abs(m.diff))} less, because it buys the item for more.
            The sales view alone calls this a win.
          </p>
        )}
      </section>
    </>
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
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex-shrink-0 text-[12px] font-semibold text-content/85 hover:text-content"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 pb-4">
        <Money item={item} mine={openStoreName} theirs={compareStoreName} />

        <section className="pt-5">
          <h3 className="text-[12px] font-bold text-content mb-2">
            Ordered, then received
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Timeline events={mineEvents} ready={supplyReady} tint={MINE} label={openStoreName} />
            <Timeline events={theirEvents} ready={supplyReady} tint={THEIRS} label={compareStoreName} />
          </div>
        </section>

        <section className="pt-5">
          <h3 className="text-[12px] font-bold text-content mb-2">
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
