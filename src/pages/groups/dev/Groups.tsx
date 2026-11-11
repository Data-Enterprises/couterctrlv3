// Hooks
import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import { useResizableBox } from "../../../hooks/useResizableBox";

// Utils
import { SHARED_GROUP_OWNER_LEVEL } from "./sharedGroups/utils";

// Interfaces
import type { GroupsTab } from "./interfaces";

// Components
import SharedGroups from "./sharedGroups/SharedGroups";
import FormNavTabs from "./components/FormNavTabs";
import ResizeHandle from "../../../components-dev/ResizeHandle";
import UserGroupsPanel from "./components/UserGroupsPanel";
import GroupsMobile from "./mobile/GroupsMobile";

/**
 * Config → Groups: the two kinds of group a person owns.
 *
 * Both lived as tabs inside User Management for a while, which put them beside
 * Companies, Base Groups and Stores — and those are three ways of saying who
 * may see what, decided by an administrator. These two are not that. A user
 * group is somebody's own saved set of their own stores, and a shared group is
 * one of those passed to a colleague. Neither grants anything, and neither is
 * an admin's to set, so sitting under User Management made them look like
 * access controls.
 *
 * Mobile keeps user groups only: shared groups has no phone tree, and a tab
 * strip of one is not a tab strip.
 */
const Groups = () => {
  const { isMobile } = useAppSelector((state) => state.app);
  const { userLevel } = useAppSelector((state) => state.user);
  const [tab, setTab] = useState<GroupsTab>("user");
  const canShare = userLevel >= SHARED_GROUP_OWNER_LEVEL;
  const { width, height, boxRef, handleProps } = useResizableBox({
    storageKey: "groups-panel-size",
    defaultWidth: 820,
    defaultHeight: 560,
    minWidth: 600,
    maxWidth: 1600,
    minHeight: 420,
    maxHeight: 950,
  });

  // No tablet layout: a tablet takes the desktop page.
  if (isMobile) return <GroupsMobile />;

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center bg-bkg">
      <div
        ref={boxRef}
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start"
        style={{ width, height }}
      >
        <div className="bg-brand_navy px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="cc-navy-title text-[13px] flex-shrink-0">
            Groups
          </span>
        </div>

        {/* User level gated to Owner for shared groups */}
        {canShare && <FormNavTabs setTab={setTab} tab={tab} />}

        {tab === "shared" && canShare ? <SharedGroups /> : <UserGroupsPanel />}
        <ResizeHandle {...handleProps} />
      </div>
    </div>
  );
};

export default Groups;
