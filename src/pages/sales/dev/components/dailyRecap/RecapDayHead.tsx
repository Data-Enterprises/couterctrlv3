import { HEAD, NUM, dayCols } from "./recapGrid";

/** The day grid's column heads. Pounds only for a store that weighs things. */
const RecapDayHead = ({ withPounds }: { withPounds: boolean }) => (
  <div
    className={`${HEAD} flex-shrink-0`}
    style={{ gridTemplateColumns: dayCols(withPounds) }}
  >
    <span />
    <span>Day</span>
    <span className={NUM}>Net sales</span>
    <span className={NUM}>Transactions</span>
    <span className={NUM}>Avg basket</span>
    <span className={NUM}>Units</span>
    {withPounds && <span className={NUM}>Pounds</span>}
    <span className={NUM}>Busiest hour</span>
  </div>
);

export default RecapDayHead;
