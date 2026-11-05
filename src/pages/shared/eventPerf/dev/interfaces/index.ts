// Interfaces
import type { HelpPage } from "../../../../../constants/helpPages";
import type { EventRow } from "../../../../../features/dev/devEventPerfSlice";
import type { SaleReceiptLine as ReceiptLine } from "../../../../../interfaces";
import type { useEventPerfView } from "../hooks";

/** One line on a sale receipt: defined in src/interfaces as SaleReceiptLine,
 *  because eventPerfSlice holds it. Re-exported under this page's name. */
export type { ReceiptLine };

export interface EventFetchResult {
  rows: EventRow[];
  baseline: EventRow[];
  lenses: string[];
}

export interface EventPerfMobileProps {
  /** Which page this is. One slice serves both, so the shell has to be able to
   *  tell whose data it is holding — see `owner` on the slice. */
  pageKey: string;
  /** The searched week, ISO. Both pages derive it through `useApiContext`,
   *  which is also where the comparison window comes from — keeping that
   *  arithmetic in one place is why it is not repeated here. */
  start: string;
  end: string;
  title: string;
  /** Entry-card copy. */
  description: string;
  buttonLabel: string;
  /** The first carousel card — every event type at once. Names the LENS
   *  ("All coupons"), never the scope: the line under it already says which
   *  stores are in view, and the two saying different things is what made the
   *  card read as contradicting itself. */
  allLabel: string;
  /**
   * Which figure leads. LP asks how often, so it leads with a count; Coupon
   * Sales asks how much, so it leads with dollars. Everything downstream —
   * hero, bars, row ordering — follows this one switch.
   */
  measure: "transactions" | "amount";
  /** Loads the week and its comparison period. */
  load: (
    start: string,
    end: string,
    onProgress: (m: string) => void,
  ) => Promise<EventFetchResult>;
  /** Resolves one receipt's lines. May fetch. */
  loadReceipt: (
    saleId: string,
    day: string,
    storeid: number,
  ) => Promise<ReceiptLine[]>;
  /** Which help page the "?" opens — this screen serves more than one. */
  helpPage: HelpPage;
}

/** What the screens read: the view, plus the type picker's open state. */
export type EventPerfCtxValue = ReturnType<typeof useEventPerfView> & {
  typePickerOpen: boolean;
  setTypePickerOpen: (v: boolean) => void;
};
