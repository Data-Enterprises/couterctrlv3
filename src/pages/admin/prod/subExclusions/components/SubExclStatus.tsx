// Utils
import { CATALOG_DAYS } from "../utils";

interface SubExclStatusProps {
  loading: boolean;
  /** Catalogue batches read so far, when it takes more than one. */
  progress: { done: number; total: number } | null;
  /** The company has no stores. */
  noStores: boolean;
  /** The catalogue is read and no row is showing. */
  empty: boolean;
  /** Any department rang at all, before the search. */
  anyRows: boolean;
}

/** The line under the departments while they load, or when there are none to
 *  show and why. */
const SubExclStatus = ({
  loading,
  progress,
  noStores,
  empty,
  anyRows,
}: SubExclStatusProps) => (
  <>
    {loading && (
      <div className="flex items-center justify-center py-8 text-[12px] text-content">
        Reading sub departments
        {progress ? ` — ${progress.done} of ${progress.total} batches` : "…"}
      </div>
    )}
    {!loading && noStores && (
      <div className="flex items-center justify-center py-8 text-[12px] text-content">
        No stores on this company
      </div>
    )}
    {!loading && !noStores && empty && (
      <div className="flex items-center justify-center py-8 text-[12px] text-content text-center px-6">
        {anyRows
          ? "No departments match that search"
          : `No sub departments rang at these stores in the last ${CATALOG_DAYS} days.`}
      </div>
    )}
  </>
);

export default SubExclStatus;
