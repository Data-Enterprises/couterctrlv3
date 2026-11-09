// Utils
import { statusOf, closedOn } from "../../utils";

// Interfaces
import type { Store } from "../../../../../interfaces";

// Components
import IconButton from "../../../../../components-dev/IconButton";
import {
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/20/solid";

interface StoreRowProps {
  s: Store;
  setEditing: (s: Store) => void;
  setDeactivating: (s: Store) => void;
  changeStatus: (s: Store, action: "reactivate") => void;
}

const StoreRow = ({ s, setEditing, setDeactivating, changeStatus }: StoreRowProps) => {
  return (
    <div
      key={`${s.storeid}__${s.store_number}`}
      className={`grid grid-cols-[13%_33%_26%_14%_14%] px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-gray-50`}
    >
      <div className="truncate tabular-nums">{s.store_number}</div>
      <div className="truncate">{s.store_name}</div>
      <div className="truncate">{s.company_name}</div>
      <div className="truncate">
        {statusOf(s) === "closed" && (
          <span
            className="inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text"
            title={`Closed ${closedOn(s.deactivated_at as string)}`}
          >
            Closed
          </span>
        )}
        {statusOf(s) === "open" && (
          <span className="inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded bg-severity_healthy_bg text-severity_healthy_text">
            Active
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1">
        <IconButton
          icon={PencilIcon}
          title={`Rename ${s.store_name}`}
          onClick={() => setEditing(s)}
        />
        {statusOf(s) !== "open" && (
          <IconButton
            icon={LockOpenIcon}
            title={`Re-open ${s.store_name}`}
            onClick={() => changeStatus(s, "reactivate")}
          />
        )}
        {statusOf(s) !== "closed" && (
          <IconButton
            icon={LockClosedIcon}
            title={`Close ${s.store_name}`}
            variant="danger"
            onClick={() => setDeactivating(s)}
          />
        )}
      </div>
    </div>
  );
};

export default StoreRow;
