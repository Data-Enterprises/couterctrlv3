// Interfaces
import type { AssignPanelItem } from "../../../../../components-dev/interfaces";

// Components
import AssignPanel from "../../../../../components-dev/AssignPanel";

interface StoresTabProps {
  /** Your stores not in the group, and the group's stores. */
  available: AssignPanelItem[];
  inGroup: AssignPanelItem[];
  onAdd: (ids: number[]) => void;
  onRemove: (ids: number[]) => void;
}

/** The Stores tab: move your stores in and out of the group. */
const StoresTab = ({ available, inGroup, onAdd, onRemove }: StoresTabProps) => (
  <>
    <p className="text-[11px] text-content/95 mb-2">
      From the stores you're assigned to. Changes reach everyone the group is
      shared with. Once it's shared, it keeps at least one store — unshare it or
      delete it to empty it.
    </p>
    <AssignPanel
      leftTitle="Your stores"
      rightTitle="In the group"
      leftItems={available}
      rightItems={inGroup}
      verbs={{ assign: "Add", unassign: "Remove" }}
      onAssign={onAdd}
      onUnassign={onRemove}
    />
  </>
);

export default StoresTab;
