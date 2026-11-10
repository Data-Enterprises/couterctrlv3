// Interfaces
import type { AssociationItem } from "../../../../../../features/dev/devUpcDevSlice";
import type { SortCol } from "../interfaces";

/** How many associated items the tab asks for. */
export const LIMIT = 25;

/** Each seed-set change is a heavy fetch, so a run of checkbox clicks is
 *  collapsed into the one where the user stopped. */
export const SEED_DEBOUNCE_MS = 600;

/** An m/d/yyyy date as yyyy-mm-dd. */
export const fmtDate = (d: string) => {
  const [m, day, y] = d.split("/");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/** The associated items table's column widths. */
export const COLS = "1fr 110px 60px 70px 80px 70px 75px";

/** The value an associated item sorts by in a column. */
export const getSortValue = (item: AssociationItem, col: SortCol) => item[col];
