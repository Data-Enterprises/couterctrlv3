// Interfaces
import type { AllOrder, ReceiverItemSearchReceiver, SubDeptMargin } from "../../../../../interfaces";
import type { ReactNode } from "react";
import type { GradingMetric } from "../../../../../features/dev/devSalesLedgerSlice";
import type {
  OrdersWave,
  ReceiptsWave,
  SalesWave,
  Store,
  Window,
} from "../utils/investigationData";

export type Col =
  | "mine"
  | "theirs"
  | "gap"
  | "mineLw"
  | "theirsLw"
  | "mineLy"
  | "theirsLy"
  | "mineUnits"
  | "theirsUnits"
  | "mineCost"
  | "theirsCost"
  | "costPenalty"
  | "marginDiff"
  | "price"
  | "sellThrough"
  | "ordered"
  | "received";

export type FilterKind = "item" | "upc" | "vendor" | "cause";

export interface Slide {
  label: string;
  /** Printed in the tab. A zero is worth saying — an empty deliveries list
   *  is the finding, not a missing section. */
  count?: number;
  body: ReactNode;
}

/**
 * One order or invoice, and the department's lines on it.
 *
 * The lines are the ones this department owns: the orders wave is filtered
 * to the sub-department before it is ever stored, so "89 lines" is 89 Meat
 * lines and not the size of the order. The heading says so, because a buyer
 * reading it will otherwise take it for the whole document.
 */
export interface DocLine {
  code: string;
  description: string;
  units: number;
  cost: number;
}

/** The four steps along the top of the investigation. */
export type InvestigationTab = "holds" | "items" | "supply" | "act";

export type Stage = "sales" | "orders" | "receipts" | "done" | "failed";

export interface Investigation {
  stage: Stage;
  items: ItemVerdict[];
  summary: Summary;
  sales: SalesWave | null;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  problem: string | null;
}

export interface InvestigationArgs {
  mine: Store;
  theirs: Store;
  tw: Window;
  lw: Window;
  ly: Window;
  metric: GradingMetric;
  /** False while the view is closed, so nothing is fetched for a panel
   *  nobody has opened. */
  enabled: boolean;
}

/**
 * What went wrong with one item.
 *
 * Ordered by who owns the fix, which is also the order the tests run in:
 * a store with nothing on the shelf cannot have a price problem, so supply
 * failures are settled before anything else is considered.
 */
export type Cause =
  | "never-ordered"
  | "not-carried"
  | "not-received"
  | "cost"
  | "not-moving"
  | "price-mix"
  | "ahead"
  | "streamlined";

export interface Bands {
  /** How far a realised price has to move before it is the explanation.
   *  0.08 = 8% either way. */
  price: number;
  /**
   * How much dearer a unit has to be to buy before that is the explanation.
   *
   * Tighter than the price band, because a buying difference is a standing
   * one. A sell price moves with a promotion and comes back; paying 5% more
   * for the same case is every case, every week, until somebody renegotiates.
   */
  cost: number;
  /** Dollars below which an item is not worth a verdict. Rounding and a
   *  single unit of drift are not findings. */
  floor: number;
}

/** One item's week at both stores, with the open store's supply events.
 *
 *  `orderedQty` and `receivedUnits` are deliberately NOT comparable to each
 *  other: an order's `qty` is cases with a separate `casesize`, a receipt's
 *  `qty` is the selling units those cases came to. Nothing here divides one
 *  by the other — only whether each is present is ever asked, and
 *  sell-through uses units sold against units received, which are both real
 *  unit counts. */
export interface ItemFacts {
  productCode: string;
  description: string;
  vendorName: string;
  mineTy: number;
  theirsTy: number;
  mineLw: number;
  theirsLw: number;
  mineLy: number;
  theirsLy: number;
  mineUnits: number;
  theirsUnits: number;
  /**
   * Sold by weight, so `mineUnits` is pounds and the realised figure is a
   * price PER POUND.
   *
   * Carried on the fact rather than worked out again wherever it is needed:
   * every label, every ratio and the price ladder all have to agree about
   * which unit the item is in, and a second derivation is a second answer.
   */
  weighted: boolean;
  /**
   * What the goods cost each store, through the shared `calculateCogs`.
   *
   * Not a cost column read straight off the row: that helper takes `net_cost`
   * over `cost`, because list price ignores a vendor allowance that roughly
   * half of any delivery carries, and `weight` over `qty`, because on a scale
   * item qty counts rings rather than pounds. Both mistakes are worth whole
   * percentage points of margin — see the note on the helper.
   */
  mineCogs: number;
  theirsCogs: number;
  /**
   * Sales in MONEY, whatever metric the page is set to.
   *
   * `mineTy` is the metric figure and becomes a unit count when the page is
   * switched to quantity. Margin is money less money — pairing a unit count
   * with a cost would produce a confident number that means nothing — so the
   * dollars are carried separately and margin is always built from these.
   */
  mineSales: number;
  theirsSales: number;
  orderedQty: number;
  receivedUnits: number;
}

export interface Margins {
  /** Sales less what the goods cost, per store. */
  mine: number;
  theirs: number;
  /** Ours minus theirs, from the open store's side. */
  diff: number;
  /** Cost per unit, each. Null without units to divide by. */
  minePerUnit: number | null;
  theirsPerUnit: number | null;
  /**
   * What the per-unit difference took on the units WE sold.
   *
   * Negative when we pay more. Deliberately not a ratio: "you paid $0.23 more
   * a unit on 488 units" is the sentence somebody acts on, and a percentage
   * hides how much of it there was.
   */
  costPenalty: number | null;
}

export interface Ratios {
  /** Ours over theirs. Null where theirs is zero — there is no ratio to a
   *  store that sold none, and 0/0 is not 1. */
  units: number | null;
  dollars: number | null;
  /** Realised price, ours over theirs. Above 1 means we are dearer. */
  price: number | null;
  /** Units sold over units received in the same window. Null without a
   *  receipt: an item sold from existing stock has no sell-through to report
   *  for this week, and calling that 0% would read as a failure. */
  sellThrough: number | null;
}

export interface ItemVerdict extends ItemFacts {
  /** Ours minus theirs, from the open store's side — negative is behind. */
  gap: number;
  cause: Cause;
  ratios: Ratios;
  margins: Margins;
}

export interface InvestigationInput {
  mineTw: SubDeptMargin[];
  mineLw: SubDeptMargin[];
  mineLy: SubDeptMargin[];
  theirsTw: SubDeptMargin[];
  theirsLw: SubDeptMargin[];
  theirsLy: SubDeptMargin[];
  /** The OPEN store's orders only, already narrowed to this department. The
   *  question is about our supply chain, not theirs. */
  orders: AllOrder[];
  receivers: ReceiverItemSearchReceiver[];
  metric: GradingMetric;
  bands?: Bands;
  /** False when the window returned no orders for either store — see
   *  `causeOf`. Defaults to true, which is the state every caller with
   *  orders in hand is in. */
  ordersKnown?: boolean;
}

export interface CauseTotal {
  cause: Cause;
  dollars: number;
  items: number;
}

export interface VendorTotal {
  vendorName: string;
  dollars: number;
  items: number;
  /** The cause that accounts for most of this vendor's shortfall. One vendor
   *  owning one cause is the cluster worth finding. */
  leadCause: Cause | null;
}

export interface Summary {
  gap: number;
  byCause: CauseTotal[];
  byVendor: VendorTotal[];
}

export interface Step {
  cause: Cause;
  dollars: number;
}

export interface Decomposition {
  /** What the comparison store did. The bar the walk starts from. */
  theirs: number;
  /** What this store did. Where it lands. */
  mine: number;
  steps: Step[];
}

export interface Tile {
  /** Identity at this level — a cause key, a vendor name, or a UPC. */
  key: string;
  label: string;
  /** Always positive: area cannot encode a sign, so this side of the screen
   *  is about losses and the tiles say how big. */
  value: number;
  items: number;
  /** Whether there is a level under this one worth opening. */
  deeper: boolean;
}

export interface SupplyEvent {
  /** ISO day. Both endpoints hand back a timestamp; only the day matters. */
  date: string;
  kind: "ordered" | "received";
  /** Orders report `qty` with a separate case size; receipts report units
   *  already multiplied out. The unit is named rather than assumed, because
   *  these two are NOT the same thing and nothing here divides one by the
   *  other. */
  amount: number;
  unit: "cases" | "units";
  detail: string;
}

export interface PricePoint {
  /** Per pound on a weighed line. */
  price: number;
  units: number;
  /** Pounds at this price, straight off the row. It used to be divided out
   *  of sales by the week's rate, which drifted whenever the price moved
   *  mid-week. */
  weight: number;
  transactions: number;
  netSales: number;
  days: number;
  /** Units over transactions. Above 1 by any margin is a multi-buy showing
   *  up, and it is the one thing only the transaction count can tell you. */
  unitsPerBasket: number | null;
}

export interface PriceLadder {
  points: PricePoint[];
  /** The price the most UNITS rang at — what an item actually sold for. */
  modal: number | null;
  /**
   * Money over units across every point.
   *
   * Carried so a caller can show what an average WOULD have said, beside the
   * prices that really rang. On an item that spent six days at $1.00 and two
   * at $1.29 the average is a price nobody ever paid, and the gap between it
   * and `modal` is the whole reason this payload exists.
   */
  blended: number | null;
  unitsPerBasket: number | null;
  /** More than one price, and far enough apart to be a decision rather than
   *  a scale item's rounding. Never true on a weighted item — see `weighted`. */
  promo: boolean;
  /**
   * The item is sold by weight, so these points are NOT a price ladder.
   *
   * The price-points endpoint carries no weight column: it divides a ring's
   * money by its scan count, which on a scale item is 1. So each "price" here
   * is what one package TOTALLED — $8.46 for 1.7 lb of ground beef — and the
   * spread between them is the spread of package sizes, not of prices.
   *
   * Everything that reads a shelf price out of these points has to stop at
   * this flag. The price per pound is on the item facts, from money over
   * pounds, and is the only per-unit figure this data can honestly produce.
   */
  weighted: boolean;
}
