// Utils
import { COLS } from "../utils";

/** The departments table's heading row. */
const SubExclHead = () => (
  <div
    className={`grid ${COLS} px-3 py-2 bg-fill_soft text-[9px] cc-caps-strong flex-shrink-0`}
  >
    <div />
    <div>Department</div>
    <div>Number</div>
    <div>Where it stands</div>
    <div>Last rang</div>
    <div />
  </div>
);

export default SubExclHead;
