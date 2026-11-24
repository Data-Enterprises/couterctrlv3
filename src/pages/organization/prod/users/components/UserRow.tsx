// Utils
import { accessLabel } from "../../utils/userFilters";
import { formatDate } from "../utils";

// Interfaces
import type { User } from "../../../../../interfaces";

// Components
import {
  ArrowPathIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import IconButton from "../../../../../components/IconButton";
import Checkbox from "../../../../../components/Checkbox";

interface UserRowProps {
  user: User;
  roleText: string;
  levelText: string;
  selecting: boolean;
  /** Can be ticked while picking (not yourself, nobody above you). */
  pickable: boolean;
  picked: boolean;
  /** Above your level: no actions offered. */
  outranked: boolean;
  isSelf: boolean;
  showInactive: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onSecurity: () => void;
  onReactivate: () => void;
  onDeactivate: () => void;
}

/** One user on the grid: their details, and Edit, Duplicate, Password &
 *  security and Deactivate (or Reactivate). While picking, the row ticks. */
const UserRow = ({
  user: u,
  roleText,
  levelText,
  selecting,
  pickable,
  picked,
  outranked,
  isSelf,
  showInactive,
  onToggle,
  onEdit,
  onDuplicate,
  onSecurity,
  onReactivate,
  onDeactivate,
}: UserRowProps) => (
  <div
    onClick={pickable ? onToggle : undefined}
    className={`grid ${
      selecting
        ? "grid-cols-[2rem_11%_10%_10%_19%_10%_9%_8%_9%_7rem] border-l-2"
        : "grid-cols-[11%_10%_10%_19%_10%_9%_8%_9%_7rem]"
    } px-3 py-2 text-[13px] items-center transition-colors [content-visibility:auto] [contain-intrinsic-size:0_40px] ${
      picked
        ? "bg-row_selected border-l-row_selected_border text-content"
        : outranked
          ? "bg-fill_soft text-content/95 border-l-transparent"
          : "text-content even:bg-row_stripe hover:bg-fill_soft border-l-transparent"
    } ${pickable ? "cursor-pointer" : ""}`}
  >
    {selecting && (
      // The box toggles through the row's own click, so its
      // change must not reach the row as a second one.
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        {pickable && (
          <Checkbox
            checked={picked}
            onChange={onToggle}
            ariaLabel={`Select ${u.username}`}
          />
        )}
      </div>
    )}
    <div className="truncate">{u.username}</div>
    <div className="truncate">{u.first_name || "—"}</div>
    <div className="truncate">{u.last_name || "—"}</div>
    <div className="truncate">{u.email}</div>
    <div className="truncate">{roleText}</div>
    <div className="truncate">{levelText}</div>
    <div
      className="truncate"
      title={
        u.access_mode === "mixed"
          ? "Their base groups disagree — some by group, some by store. Editing them and saving sets one access type."
          : undefined
      }
    >
      {accessLabel(u.access_mode)}
    </div>
    <div className="truncate">{formatDate(u.last_visit)}</div>
    <div className="flex items-center justify-end gap-1">
      {/* While picking, a click on a row only ticks it: nothing
            here that would open or change somebody instead. */}
      {selecting ? null : outranked ? (
        <span className="text-[10px] italic text-content/95">Unauthorized</span>
      ) : showInactive ? (
        <IconButton
          icon={ArrowPathIcon}
          title="Reactivate"
          onClick={onReactivate}
        />
      ) : (
        <>
          <IconButton icon={PencilIcon} title="Edit" onClick={onEdit} />
          <IconButton
            icon={DocumentDuplicateIcon}
            title="Duplicate"
            onClick={onDuplicate}
          />
          {/* The backend refuses a password or security reset
                for anyone above your level. */}
          {!outranked && (
            <IconButton
              icon={KeyIcon}
              title="Password & security"
              onClick={onSecurity}
            />
          )}
          {/* Deactivate (reversible from Inactive). Hidden on
                your own row: the server refuses it. */}
          {!isSelf && (
            <IconButton
              icon={TrashIcon}
              title="Deactivate"
              variant="danger"
              onClick={onDeactivate}
            />
          )}
        </>
      )}
    </div>
  </div>
);

export default UserRow;
