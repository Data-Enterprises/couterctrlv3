// Utils
import { formatCurrency2 } from "../../../../../utils";
import { ACTION_TONE } from "../../utils/actionTone";
import { BASKET_COLS, cell, num } from "../utils";

// Interfaces
import type { ActionKind } from "../../interfaces";
import type { BasketLine } from "../interfaces";

interface BasketLineRowProps {
  line: BasketLine;
  /** This is the item the reader came for, marked among the rest. */
  isItem: boolean;
  action?: ActionKind;
  zebra: boolean;
}

/** One product in a basket: description and code, price types, quantity, unit
 *  price and net. The item you came for wears its action's colour. */
const BasketLineRow = ({
  line: l,
  isItem,
  action,
  zebra,
}: BasketLineRowProps) => {
  // Applied per cell, not inherited — every cell sets its own
  // `text-content`, which would win over anything on the row.
  const ink = isItem && action ? ACTION_TONE[action].text : "text-content";

  return (
    <div
      className={`grid gap-3 px-4 py-2 items-center border-b border-line_hair ${
        isItem
          ? action
            ? ACTION_TONE[action].row
            : "bg-fill_muted"
          : zebra
            ? "bg-row_stripe"
            : ""
      }`}
      style={{ gridTemplateColumns: BASKET_COLS }}
    >
      <div className="min-w-0">
        <div className={`text-[13px] font-medium truncate ${ink}`}>
          {l.description}
        </div>
        <div
          className={`text-[12px] font-medium truncate ${
            isItem ? ink : "text-content/95"
          }`}
        >
          {l.code}
          {l.coupon > 0 && ` · ${formatCurrency2(l.coupon)} coupon`}
          {/* Both halves of a discounted item are marked, and each
              says which half it is. */}
          {isItem && (l.discount ? " · discount on this item" : " · this item")}
        </div>
      </div>
      {/* Every price type this item rang under. More than one is
          worth seeing, so they are joined rather than reduced. */}
      <span className={`${cell} ${ink}`}>{[...l.priceTypes].join(" · ")}</span>
      <span className={`${num} ${ink}`}>{l.discount ? "—" : l.qty}</span>
      {/* Per unit: with quantity aggregated the line total no longer says
          what anything rang at, and the unit price is what you compare
          against the price row you arrived from. */}
      <span className={`${num} ${ink}`}>
        {l.qty > 0 ? formatCurrency2(l.net / l.qty) : "—"}
      </span>
      <span className={`${num} ${ink}`}>{formatCurrency2(l.net)}</span>
    </div>
  );
};

export default BasketLineRow;
