// Interfaces
import type { AssignPanelItem } from "../../../../../components-dev/interfaces";

// Components
import AssignPanel from "../../../../../components-dev/AssignPanel";

interface UsersTabProps {
  /** People it can be shared with, and people who have it. */
  shareable: AssignPanelItem[];
  sharedWith: AssignPanelItem[];
  /** The group has no stores yet, so it can't be shared. */
  noStores: boolean;
  onShare: (ids: number[]) => void;
  onUnshare: (ids: number[]) => void;
}

/** The Users tab: share the group with people, or take it back. */
const UsersTab = ({
  shareable,
  sharedWith,
  noStores,
  onShare,
  onUnshare,
}: UsersTabProps) => (
  <div className="flex-1 min-h-0 flex flex-col">
    <p className="text-[11px] text-content/95 mb-2">
      Sharing puts the group in their User Groups and store picker. It doesn't
      change which stores they can open, and they only see the group's stores
      they're assigned to. People at your level or below who share a company
      with you.
    </p>
    <p className="text-[11px] text-content/95 mb-2">
      You created this group, so you already have it — it's in your User Groups
      and your store picker. You don't need to share it with yourself.
    </p>
    {noStores && (
      <p className="text-[11px] text-severity_watch_text mb-2">
        This group has no stores yet. Add some on the Stores tab before sharing
        it.
      </p>
    )}
    <AssignPanel
      leftTitle="Not shared with"
      rightTitle="Shared with"
      verbs={{ assign: "Share", unassign: "Unshare" }}
      leftItems={shareable}
      rightItems={sharedWith}
      onAssign={onShare}
      onUnassign={onUnshare}
      fill
    />
  </div>
);

export default UsersTab;
