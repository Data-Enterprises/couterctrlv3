// Hooks
import { useMemo } from "react";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { BASKET_COLS } from "../utils";
import { basketTotal, groupBasket } from "../utils/basket";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";
import type { ActionKind } from "../../interfaces";

// Components
import BasketLineRow from "./BasketLineRow";

interface BasketTableProps {
  basket: TransactionListItem[];
  productCode: string;
  action?: ActionKind;
}

/** One sale's basket, one row per product in register order, with its item,
 *  discount and line counts and the total. */
const BasketTable = ({ basket, productCode, action }: BasketTableProps) => {
  const grouped = useMemo(() => groupBasket(basket), [basket]);
  const itemRowCount = grouped.filter((g) => !g.discount).length;
  const discountRowCount = grouped.length - itemRowCount;

  return (
    <>
      <div
        className="cc-thead grid gap-3 px-4 py-1.5 text-[11.5px] cc-caps"
        style={{ gridTemplateColumns: BASKET_COLS }}
      >
        <span>Item</span>
        <span>Price type</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit</span>
        <span className="text-right">Net</span>
      </div>
      {grouped.map((l, i) => (
        <BasketLineRow
          key={`${l.code}-${l.discount ? "dc" : "item"}`}
          line={l}
          isItem={l.code === productCode}
          action={action}
          zebra={i % 2 === 1}
        />
      ))}
      {grouped.length > 0 && (
        <div className="px-4 py-2 text-[12px] font-medium text-content flex items-center justify-between">
          {/* Discount rows are counted apart from the items: calling one
              an item would say the basket held something it did not. */}
          <span>
            {itemRowCount} item{itemRowCount === 1 ? "" : "s"}
            {discountRowCount > 0 &&
              ` · ${discountRowCount} discount${discountRowCount === 1 ? "" : "s"}`}
            {" · "}
            {basket.length} line{basket.length === 1 ? "" : "s"}
          </span>
          <span className="tabular-nums">
            {formatCurrency2(basketTotal(basket))}
          </span>
        </div>
      )}
    </>
  );
};

export default BasketTable;
