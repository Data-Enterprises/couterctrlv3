import type { TopItemPricePoint } from "../../../../../../api/topItems";

/** One price, and what each store did at it. */
export interface PriceLine {
  price: number;
  mine: TopItemPricePoint | null;
  theirs: TopItemPricePoint | null;
}
