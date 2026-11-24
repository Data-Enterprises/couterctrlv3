// Utils
import { STORE_GRID } from "../utils";

interface StoreTableHeadProps {
  /** Status has a heading only while the endpoint reports it. */
  statusKnown: boolean;
}

/** The Stores table's heading row. */
const StoreTableHead = ({ statusKnown }: StoreTableHeadProps) => (
  <div
    className={`grid ${STORE_GRID} px-3 py-2 bg-fill_soft text-[9px] cc-caps-strong flex-shrink-0`}
  >
    <div>Number</div>
    <div>Name</div>
    <div>Company</div>
    <div>{statusKnown ? "Status" : ""}</div>
    <div></div>
  </div>
);

export default StoreTableHead;
