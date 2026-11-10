// Hooks
import { useState } from "react";

// Utils
import { ladderFor, supplyTimeline } from "../utils/supplyEvidence";
import {
  CAUSE_LABEL,
  CAUSE_TONE,
  evidenceSays,
} from "../utils/deptInvestigation";

// Interfaces
import type { ItemVerdict } from "../interfaces";
import type {
  AllOrder,
  ReceiverItemSearchReceiver,
  SubsPricePoint,
} from "../../../../../interfaces";

// Components
import SideBySide from "./SideBySide";
import EventTimeline from "./EventTimeline";
import Ladder from "./Ladder";
import Fold from "./Fold";

interface ItemEvidenceProps {
  item: ItemVerdict;
  /** The names, not the numbers alone. Both halves of the rail are two
   *  columns of figures and a bare "15" over one of them is a legend the
   *  reader has to go and find. The number comes down beside it so the
   *  header can set it on its own line rather than let it run off the end
   *  of the column -- see `splitStore`. */
  openStoreName: string;
  openStoreNumber: string;
  compareStoreName: string;
  compareStoreNumber: string;
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
const ItemEvidence = ({
  item,
  openStoreName,
  openStoreNumber,
  compareStoreName,
  compareStoreNumber,
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
}: ItemEvidenceProps) => {
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
          <SideBySide
            item={item}
            mine={openStoreName}
            mineNumber={openStoreNumber}
            theirs={compareStoreName}
            theirsNumber={compareStoreNumber}
          />
        </Fold>

        <Fold title="Ordered, then received">
          {/* One line when there is nothing on either side. Two empty
              timelines side by side took a third of the panel to say
              nothing twice. */}
          {supplyReady &&
          mineEvents.length === 0 &&
          theirEvents.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-content/95 rounded-lg bg-bkg px-3.5 py-3">
              <span className="font-semibold text-content">
                Neither store ordered or received it
              </span>{" "}
              in the window. That is the finding, not a gap in the data.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <EventTimeline
                events={mineEvents}
                ready={supplyReady}
                tint={MINE}
                label={openStoreName}
              />
              <EventTimeline
                events={theirEvents}
                ready={supplyReady}
                tint={THEIRS}
                label={compareStoreName}
              />
            </div>
          )}
        </Fold>

        <Fold title="What it actually rang at">
          {/* One above the other. Side by side each card had half a
              panel for a chart, a ladder and a sentence, and the store
              that rang nothing still took its half to say so. */}
          <div className="flex flex-col gap-3">
            <Ladder ladder={mineLadder} label={openStoreName} mine />
            <Ladder
              ladder={theirLadder}
              label={compareStoreName}
              mine={false}
            />
          </div>
        </Fold>
      </div>
    </div>
  );
};

export default ItemEvidence;
