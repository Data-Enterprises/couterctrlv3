import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useResizableBox } from "../../../hooks/useResizableBox";
import ResizeHandle from "../../../components-dev/ResizeHandle";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";
import { setGroups, setSelectedGroup, type Group, emptyGroup } from "../../../features/groupSlice";
import { setCreateInput, setRefreshGroups, setSelectedForm, setStoresWithGroupStatus } from "../../../features/dev/devGroupsPageSlice";
import type { GroupFormType } from "../../../interfaces";
import { getGroups, createGroup } from "../../../api/groups";
import { useGroupCtx } from ".";
import GroupsMobile from "./mobile/GroupsMobile";
import GroupsList from "./GroupsList";
import GroupDetail from "./GroupDetail";
import SharedGroups from "../../organization/dev/sharedGroups/SharedGroups";
import { SHARED_GROUP_OWNER_LEVEL } from "../../organization/dev/sharedGroups/hooks";

const NewGroupModal = ({
  onCreate,
  onClose,
}: {
  onCreate: (name: string) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-custom-white rounded-xl p-5 w-[300px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          New group
        </div>
        <div className="mb-4">
          <label className="text-[11px] text-content/60 block mb-1">
            Group name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. West Coast"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * The data side of the Groups screens, shared by the desktop panel and the
 * phone view: loads the user's groups and keeps the mobile form state in step.
 *
 * Everything GET /groups/ returns: their own groups, the shared groups they
 * created, and the shared groups other people shared with them. Shared ones
 * carry the SHARED badge and open read-only, showing only the stores the
 * user is assigned to; they're managed on User Management's Shared Groups tab.
 *
 * Reloaded on open rather than trusting the list fetched at sign-in, which is
 * stale the moment a group is shared or unshared.
 */
const useGroupsData = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();

  // These two effects only matter for the mobile view — GroupsMobile still
  // switches its own internal view off the shared selectedForm/createInput/
  // storesWithGroupStatus slice fields, so this reset-on-tab-change behavior
  // has to stay intact for them even though the desktop panel never reads
  // those fields itself.
  useEffect(() => {
    dispatch(setRefreshGroups(true));
  }, []);

  useEffect(() => {
    dispatch(setSelectedForm("create"));
    return () => {
      dispatch(setSelectedGroup(emptyGroup));
      dispatch(setCreateInput(""));
      dispatch(setStoresWithGroupStatus([]));
      dispatch(setSelectedForm(""));
    };
  }, []);

  useEffect(() => {
    dispatch(setSelectedGroup(emptyGroup));
    dispatch(setCreateInput(""));
    dispatch(setStoresWithGroupStatus([]));
  }, [ctx.selectedForm]);

  useEffect(() => {
    if (!ctx.refreshGroups) return;
    getGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setGroups(j.groups as Group[]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setRefreshGroups(false)));
  }, [ctx.token, ctx.refreshGroups]);
};

/** The phone view of the user's own groups. */
export const UserGroupsMobile = () => {
  const dispatch = useAppDispatch();
  useGroupsData();
  const handleFormSelect = (formType: GroupFormType) => {
    dispatch(setSelectedForm(formType));
  };
  return <GroupsMobile handleFormSelect={handleFormSelect} />;
};

/**
 * The desktop body — list on the left, a group's detail on the right — with
 * no page frame of its own, so User Management can host it as its User Groups
 * tab. The Store Groups page below wraps it in its own frame.
 */
export const UserGroupsPanel = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();
  const [selectedGroup, setSelectedGroupLocal] = useState<Group | null>(null);
  const [search, setSearch] = useState("");
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  useGroupsData();

  const filteredGroups = ctx.groups.filter((g) =>
    g.group_name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateGroup = (name: string) => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    const exists = ctx.groups.some(
      (g) => g.group_name.toLowerCase() === name.trim().toLowerCase(),
    );
    if (exists) {
      toast.error("A group with that name already exists");
      return;
    }
    createGroup(ctx.url, ctx.token, ctx.userid, name.trim())
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          toast.success("Group created successfully");
          setShowNewGroupModal(false);
          dispatch(setRefreshGroups(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleGroupRenamed = (newName: string) => {
    setSelectedGroupLocal((prev) => (prev ? { ...prev, group_name: newName } : prev));
    dispatch(setRefreshGroups(true));
  };

  const handleGroupDeleted = () => {
    setSelectedGroupLocal(null);
    dispatch(setRefreshGroups(true));
  };

  return (
    <div className="flex flex-1 min-h-0 w-full">
      <GroupsList
        userid={ctx.userid}
        groups={filteredGroups}
        totalCount={ctx.groups.length}
        selectedId={selectedGroup?.id ?? 0}
        search={search}
        onSearchChange={setSearch}
        onSelect={setSelectedGroupLocal}
        onOpenCreate={() => setShowNewGroupModal(true)}
      />
      {!selectedGroup ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-content">
          Select a group
        </div>
      ) : (
        <GroupDetail
          group={selectedGroup}
          onRenamed={handleGroupRenamed}
          onDeleted={handleGroupDeleted}
        />
      )}
      {showNewGroupModal && (
        <NewGroupModal
          onCreate={handleCreateGroup}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}
    </div>
  );
};

type GroupsTab = "user" | "shared";

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
  if (isMobile) return <UserGroupsMobile />;

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center bg-bkg">
      <div
        ref={boxRef}
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start"
        style={{ width, height }}
      >
        <div className="bg-brand_navy px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            Groups
          </span>
        </div>

        {/* Only when there is a choice to make. Below the sharing level this
            page is store groups and nothing else, and one tab would be
            chrome pretending to be a decision. */}
        {canShare && (
          <div className="flex border-b border-gray-100 flex-shrink-0">
            {(
              [
                ["user", "User Groups"],
                ["shared", "Shared Groups"],
              ] as [GroupsTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                  tab === id
                    ? "border-brand_navy text-brand_navy"
                    : "border-transparent text-content"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === "shared" && canShare ? <SharedGroups /> : <UserGroupsPanel />}
        <ResizeHandle {...handleProps} />
      </div>
    </div>
  );
};

export default Groups;
