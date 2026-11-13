// Interfaces
import type {
  TopItemPricePoint,
  TopItemRow,
} from "../../../../../../api/topItems";

/** One price, and what each store did at it. */
export interface PriceLine {
  price: number;
  mine: TopItemPricePoint | null;
  theirs: TopItemPricePoint | null;
}

/** One store's week, as this tab needs it. */
export interface Side {
  rows: TopItemRow[];
  points: TopItemPricePoint[];
}
