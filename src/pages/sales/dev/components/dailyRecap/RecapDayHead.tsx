import { HEAD, NUM, dayCols } from "./recapGrid";

/** The day list's column heads. Pounds only for a store that weighs things. */
const RecapDayHead = ({ withPounds }: { withPounds: boolean }) => (
  <div className={HEAD} style={{ gridTemplateColumns: dayCols(withPounds) }}>
    <span />
    <span>Day</span>
    <span>Net sales</span>
    <span className={NUM}>Transactions</span>
    <span className={NUM}>Avg basket</span>
    <span className={NUM}>Units</span>
    {withPounds && <span className={NUM}>Pounds</span>}
    <span>Busiest hour</span>
  </div>
);

export default RecapDayHead;
