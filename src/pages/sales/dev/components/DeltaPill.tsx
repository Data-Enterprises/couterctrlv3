import { comparisonPillClass, pillClass } from "../../../../utils/severity";
import { PCT_COL_W } from "./utils";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

/**
 * A graded comparison figure, as the ledger draws it.
 *
 * Lifted out of LedgerRow once the comparison grids needed the same thing: a
 * percentage that bands on the page threshold, greys out when the comparison
 * does not cover the whole week, and says why in its tooltip. Two copies of
 * this would drift, and a store's figure reading one way in the ledger and
 * another in the grid beside it is worse than either.
 */
const DeltaPill = ({
  has,
  pct,
  threshold,
  complete,
  matched,
  days,
  period,
}: {
  has: boolean;
  pct: number;
  threshold: number;
  /** False when the comparison is missing days. It still shows its figure,
   *  in grey: a partial week can't grade a store, so it doesn't get the
   *  colour that says it did. */
  complete: boolean;
  matched: number;
  days: number;
  period: "last week" | "last year";
}) => (
  <span
    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
      has
        ? comparisonPillClass(pct, complete, threshold)
        : // Null is the shared helper's own "no comparison" case.
          pillClass(null, threshold)
    }`}
    style={{ minWidth: PCT_COL_W }}
    title={
      has && !complete
        ? `Only ${matched} of ${days} days have a matching day ${period}, so this isn't used to grade the store.`
        : undefined
    }
  >
    {has ? formatPct(pct) : "—"}
  </span>
);
export default DeltaPill;
