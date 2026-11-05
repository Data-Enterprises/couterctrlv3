// Hooks
import { useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useGroupCtx } from "../hooks";
import type { Group } from "../../../../features/groupSlice";
import { useGroupsData } from "../hooks";

// Redux
import { setRefreshGroups } from "../../../../features/dev/devGroupsPageSlice";

// API
import { createGroup } from "../../../../api/groups";

// Interfaces
import type { JsonError } from "../../../../interfaces";

// Components
import GroupsList from "./GroupsList";
import GroupDetail from "./GroupDetail";
import NewGroupModal from "./NewGroupModal";

const UserGroupsPanel = () => {
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
    setSelectedGroupLocal((prev) =>
      prev ? { ...prev, group_name: newName } : prev,
    );
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

export default UserGroupsPanel;
