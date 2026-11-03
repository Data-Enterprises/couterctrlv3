import { HEAD, NUM, dayCols } from "./recapGrid";

/**
 * The day list's column heads, each over its own fixed-width column.
 * Weight only for a store that weighs things.
 */
const RecapDayHead = ({
  withPounds,
  narrow,
}: {
  withPounds: boolean;
  narrow: boolean;
}) => (
  <div
    className={`${HEAD} flex-shrink-0`}
    style={{ gridTemplateColumns: dayCols(withPounds, narrow) }}
  >
    <span>Day</span>
    <span className={NUM}>Net sales</span>
    <span className={NUM}>Trans</span>
    <span className={NUM}>Avg basket</span>
    <span className={NUM}>Items</span>
    <span className={NUM}>Qty</span>
    {withPounds && <span className={NUM}>Weight</span>}
    <span className="pl-2">Busiest hour</span>
  </div>
);

export default RecapDayHead;
