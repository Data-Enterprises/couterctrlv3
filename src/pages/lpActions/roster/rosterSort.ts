import type { SortState } from "../../../utils/useTriStateSort";
import type { LpRosterSortCol } from "../../../features/lpActionsSlice";
import type { RosterCashier, RosterStore } from "./rosterModel";

/**
 * Sorting the roster, at both levels.
 *
 * A store section and the operators inside it sort by the same column, so a
 * list ordered by Total reads as one ordered list rather than as stores in one
 * order holding people in another.
 *
 * `null` is not "no order" — it is the roster's own order, worst grade first,
 * which is what the page is for. Sorting is a lens over that, and the third
 * click puts it back.
 *
 * Two rules the comparator keeps:
 *
 *  - **A missing multiple sorts last in BOTH directions.** `null` there means
 *    too few occurrences to read a rate from, or no history to divide by —
 *    absent, not small. Treating it as zero would park every un-gradable row
 *    at the top of an ascending sort, which reads as "these are the calmest"
 *    when it means "these cannot be compared".
 *  - **Names sort alphabetically**, not by the numeric path everything else
 *    takes, so the one text column behaves the way a text column should.
 */

type Row = RosterCashier | RosterStore;

const isCashier = (row: Row): row is RosterCashier => "cashierName" in row;

const nameOf = (row: Row) =>
  isCashier(row) ? row.cashierName : row.storeName;

/** Every week in the strip, which is what the `N wks` column is showing. */
const weeksTotal = (row: Row) => row.weeks.reduce((sum, n) => sum + n, 0);

const valueOf = (row: Row, col: LpRosterSortCol): number | null => {
  if (col === "weeks") return weeksTotal(row);
  if (col === "total") return row.latestValue;
  if (col === "base") return row.multiple;
  return null;
};

const compare = (
  a: Row,
  b: Row,
  sort: NonNullable<SortState<LpRosterSortCol>>,
) => {
  const dir = sort.dir === "asc" ? 1 : -1;

  if (sort.col === "name") {
    return nameOf(a).localeCompare(nameOf(b)) * dir;
  }

  const va = valueOf(a, sort.col);
  const vb = valueOf(b, sort.col);
  if (va === null) return vb === null ? 0 : 1;
  if (vb === null) return -1;
  return (va - vb) * dir;
};

export const sortRoster = (
  stores: RosterStore[],
  sort: SortState<LpRosterSortCol>,
): RosterStore[] => {
  if (!sort) return stores;
  return [...stores]
    .map((store) => ({
      ...store,
      cashiers: [...store.cashiers].sort((a, b) => compare(a, b, sort)),
    }))
    .sort((a, b) => compare(a, b, sort));
};
