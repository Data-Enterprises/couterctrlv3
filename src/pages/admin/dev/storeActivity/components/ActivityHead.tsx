// Utils
import { ACTIVITY_GRID } from "../utils";

/** The activity table's heading row. */
const ActivityHead = () => (
  <div
    data-help="activity-grid"
    className={`grid ${ACTIVITY_GRID} px-4 py-2 bg-fill_soft text-[9px] cc-caps-strong flex-shrink-0`}
  >
    <div>ID</div>
    <div>Store name</div>
    <div className="text-right">Total days</div>
    <div className="text-right">Active</div>
    <div className="text-right">Missing</div>
  </div>
);

export default ActivityHead;
