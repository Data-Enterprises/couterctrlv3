// Utils
import { prettyDate } from "../utils";

// Interfaces
import type { DeptAtStore } from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";

interface DeptAtStoreRowProps {
  a: DeptAtStore;
  /** The department's name, for the checkbox's label. */
  label: string;
  saving: boolean;
  onChange: (next: boolean) => void;
}

/** One store's line under an expanded sub department: a checkbox to exclude it from net sales at that store,
 *  with the store number, name, sub dept number and last rang date. */
const DeptAtStoreRow = ({
  a,
  label,
  saving,
  onChange,
}: DeptAtStoreRowProps) => (
  <div className="flex items-center gap-2 py-1 text-[11.5px] text-content">
    <Checkbox
      checked={a.excluded}
      disabled={saving}
      ariaLabel={`Exclude ${label} at ${a.store_name}`}
      onChange={onChange}
    />
    <span className="tabular-nums font-semibold w-[46px]">
      {a.store_number}
    </span>
    <span className="truncate flex-1">{a.store_name}</span>
    <span className="tabular-nums text-content/95 w-[52px]">
      #{a.sub_department}
    </span>
    <span className="tabular-nums text-content/95 w-[64px] text-right">
      {prettyDate(a.lastRung)}
    </span>
  </div>
);

export default DeptAtStoreRow;
