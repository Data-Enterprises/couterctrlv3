// Utils
import { prettyDate, planStoreToggle } from "../utils";

// Interfaces
import type {
  ExclusionWrite,
  CompanyDeptRow,
  DeptAtStore,
} from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";

interface DeptAtStoreRowProps {
  a: DeptAtStore;
  row: CompanyDeptRow;
  send: (writes: ExclusionWrite[], label: string, want: boolean) => void;
  saving: boolean;
}

const DeptAtStoreRow = ({ a, row, send, saving }: DeptAtStoreRowProps) => {
  return (
    <div
      className="flex items-center gap-2 py-1 text-[11.5px] text-content"
    >
      <Checkbox
        checked={a.excluded}
        disabled={saving}
        ariaLabel={`Exclude ${row.label} at ${a.store_name}`}
        onChange={(next) =>
          send(
            planStoreToggle(row, a.storeid, next),
            `${row.label} at ${a.store_number}`,
            next,
          )
        }
      />
      <span className="tabular-nums font-semibold w-[46px]">
        {a.store_number}
      </span>
      <span className="truncate flex-1">{a.store_name}</span>
      <span className="tabular-nums text-content/85 w-[52px]">
        #{a.sub_department}
      </span>
      <span className="tabular-nums text-content/85 w-[64px] text-right">
        {prettyDate(a.lastRung)}
      </span>
    </div>
  );
};

export default DeptAtStoreRow;
