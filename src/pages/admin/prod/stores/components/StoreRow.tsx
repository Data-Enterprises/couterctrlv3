// Utils
import { statusOf, closedOn } from "../../utils";
import { STORE_GRID } from "../utils";

// Interfaces
import type { Store } from "../../../../../interfaces";

// Components
import IconButton from "../../../../../components/IconButton";
import {
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/20/solid";

interface StoreRowProps {
  store: Store;
  /** Close and Re-open: level 9 or support only on the backend. */
  canChangeStatus: boolean;
  /** Rename: refused below level 9 or support for a store with no company. */
  canRename: boolean;
  onRename: () => void;
  onClose: () => void;
  onReopen: () => void;
}

/** One store row on the Store Records tab: number, name, company and an Active or Closed badge, with Rename
 *  and Close or Re-open buttons. */
const StoreRow = ({
  store: s,
  canChangeStatus,
  canRename,
  onRename,
  onClose,
  onReopen,
}: StoreRowProps) => (
  <div
    className={`grid ${STORE_GRID} px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-fill_soft`}
  >
    <div className="truncate tabular-nums">{s.store_number}</div>
    <div className="truncate">{s.store_name}</div>
    <div
      className="truncate"
      title={
        canRename
          ? undefined
          : "No company: only level 9 or support can change this store"
      }
    >
      {s.company_name || "No company"}
    </div>
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
      {canRename && (
        <IconButton
          icon={PencilIcon}
          title={`Rename ${s.store_name}`}
          onClick={onRename}
        />
      )}
      {canChangeStatus && statusOf(s) !== "open" && (
        <IconButton
          icon={LockOpenIcon}
          title={`Re-open ${s.store_name}`}
          onClick={onReopen}
        />
      )}
      {canChangeStatus && statusOf(s) !== "closed" && (
        <IconButton
          icon={LockClosedIcon}
          title={`Close ${s.store_name}`}
          variant="danger"
          onClick={onClose}
        />
      )}
    </div>
  </div>
);

export default StoreRow;
