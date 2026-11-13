// Interfaces
import type { GradeBasis } from "../utils/ledgerUtils";
import type { Severity } from "../../../../utils/severity";
import type { DayDot } from "../../../../interfaces";

/** One store's row in the Sales ledger: its identity, figures and grades. */
export type LedgerRowData = {
  storeid: number;
  store_name: string;
  store_number: string;
  /** Every store_number this storeid returned. Length > 1 means co-located
   * stores sharing one id — the name resolves by storeid and is identical for
   * both, so the number is what tells them apart. Feeds
   * applyStoreNumberToName, which needs the full set to know which digits in
   * the name are the store number. */
  storeNumbersForId: string[];
  twTotal: number;
  lwTotal: number;
  lyTotal: number;
  twQty: number;
  lwQty: number;
  lyQty: number;
  /** The TW side of each comparison — only the days that found a match.
   *  `twTotal` above is the whole week and is NOT the base of vsLWPct or
   *  vsLYPct; a rollup that adds these instead stays weighted by store size
   *  without ever dividing a seven-day figure by a three-day one. */
  twTotalForLW: number;
  twQtyForLW: number;
  twTotalForLY: number;
  twQtyForLY: number;
  /** Coverage, so a percentage over three of seven days can be presented as
   *  the weaker claim it is. */
  dayCount: number;
  lwDayCount: number;
  lyDayCount: number;
  vsLWPct: number;
  vsLYPct: number;
  vsLYDollar: number;
  hasLW: boolean;
  hasLY: boolean;
  /** The comparison that decided `severity` — last year only when it covers
   *  the whole week, else last week, else neither. */
  gradedOn: GradeBasis;
  /** Null when neither comparison covers the whole week: not graded, and not
   *  counted under Critical, Watch or OK. */
  severity: Severity | null;
  days: DayDot[];
};

/** What the three figures need from a row: a sub department or an hour. */
export interface PeriodRow {
  tw: number;
  lw: number;
  ly: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWPct: number;
  vsLYPct: number;
}
