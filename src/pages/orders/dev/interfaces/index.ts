// Interfaces
import type { AllOrder } from "../../../../interfaces";
import type { OrderFlag } from "../../../../features/dev/devOrdersSlice";
import type { SortState } from "../../../../utils/useTriStateSort";
import type { EDITABLE } from "../utils/orderEdit";

export type EditSearch = { code: string; desc: string; onlyChanged: boolean };
export type VendorOption = { id: string; name: string };
export type SubDeptOption = { id: number; name: string };

export type EditableField = (typeof EDITABLE)[number];

/** One order: one store, one date, one order number. */
export type OrderDoc = {
  key: string;
  storeid: number;
  storenumber: string;
  storename: string;
  /** ISO, exactly as it arrived — the backend reformats it itself. */
  order_date: string;
  order_id: number;
  order_type: string;
  lineCount: number;
};

export type DraftLine = AllOrder & {
  /**
   * The three editable values as they arrived, for the revert and the "was"
   * note. Null on a line added here, which has nothing to go back to.
   */
  original: Pick<AllOrder, EditableField> | null;
};

export type OrderDraft = {
  doc: OrderDoc;
  lines: DraftLine[];
  /**
   * Bumped when a value is replaced from outside the field it lives in — a
   * revert, or the lookup filling an added line.
   *
   * The three editable cells are uncontrolled inputs, because a controlled
   * number input rewrites what is in the box on every keystroke: it moves the
   * caret to the end mid-number and formatting a half-typed "5" to "5.00"
   * makes the next digit land in the wrong place. Uncontrolled means React
   * has to be told when the value changed underneath it, which is what this
   * is for — the cells key on it, so a revert remounts them and a keystroke
   * does not.
   */
  resetNonce: number;
};

/**
 * What the Edit-mode left panel is narrowed to. An empty string is "any".
 */
export interface OrderPick {
  storeNumber: string;
  orderDate: string;
  orderType: string;
}

/**
 * What can be written onto an added line.
 *
 * Everything on it is typed or picked: the UPC, the description, the sub
 * department and the vendor. The item lookup fills the same fields when it
 * finds the code, which is why this is one shape rather than a lookup path
 * and a manual one that could drift apart.
 */
export type LinePatch = Partial<
  Pick<
    AllOrder,
    | "product_code"
    | "description"
    | "sub_department"
    | "sub_department_description"
    | "vendor_id"
    | "vendor_name"
    | "base_cost"
    | "net_cost"
    | "active_retail_price"
    | "casesize"
    | "scalable"
  >
>;

export type Check = { id: string; label: string; ok: boolean };

/** One order Fix cost would change, for the modal's per-store list. */
export type StagePreview = {
  doc: OrderDoc;
  /** The item's lines on this order — usually one. */
  lineNumbers: number[];
  casesize: number;
  /** What the case cost becomes at the typed unit cost. */
  newCaseCost: number;
};

export interface OrdersFilterState {
  orderTypes: string[];
  storeNumbers: string[];
  dates: string[];
  subIds: number[];
  productCodes: string[];
  orderIds: number[];
}

export type FilterKey = keyof OrdersFilterState;

/** Every reachable value, per filter, as strings — which is what the
 *  controls hold, whatever the row's own type is. */
export type Available = Record<FilterKey, Set<string>>;

export type SortKey = "order" | "seq" | "qty" | "ext_retail" | "profit";

/** Null is the list's own order, which is what the tri-state cycle returns to. */
export type GridSort = SortState<SortKey>;

export interface ProblemItem {
  code: string;
  /** The first real description any of its lines carries — some arrive null. */
  desc: string;
  /**
   * What is wrong with it, in reading order. Empty for an item that is only
   * here because a search found it.
   *
   * High margin is read from lines that HAVE a cost. A line with no cost
   * rings 100%, so on Browse every missing-cost line is a high-margin line
   * too — and here that meant the High margin filter led with the same
   * missing-cost items Missing cost did, sorted first at 100%, so clicking it
   * appeared to change nothing. A missing cost is listed once, as what it is.
   *
   * Read from the lines as loaded, not as staged: an item stays in the list
   * after it is fixed, marked as staged, so the session's work stays visible.
   */
  flags: OrderFlag[];
  stores: number;
  orders: number;
  /** The highest margin any of its costed lines rings, for ordering the
   *  high-margin items worst first. Null when none has retail to measure. */
  topMargin: number | null;
  /** Orders of this item holding a cost change not yet submitted. */
  staged: number;
}

/** What the item's lines on one order come to. */
export interface Figures {
  /** The unit cost behind the case cost. Here so the column somebody types
   *  into previews like every other one: case size is per store, so one
   *  typed unit cost is one number here and a different case cost there. */
  unitCost: number;
  caseCost: number;
  extCost: number;
  margin: number | null;
}

/** One order carrying the item, as the Problems tab shows it. */
export interface ItemStoreRow {
  doc: OrderDoc;
  /** The item's lines on this order — usually one. */
  lineNumbers: number[];
  /** As loaded. Zero means ordered by the unit: case cost IS the unit cost. */
  casesize: number;
  qty: number;
  unitNow: number;
  now: Figures;
  /** At the typed unit cost. Null while nothing valid is typed. */
  after: Figures | null;
  /** Whether staging would change anything on this order. */
  changes: boolean;
}
