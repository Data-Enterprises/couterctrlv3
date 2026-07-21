import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";
import {
  setCreateInput,
  setGroups,
  setRefreshGroups,
  setSelectedForm,
  setSelectedGroup,
  setStoresWithGroupStatus,
  type Group,
  type GroupFormType,
} from "../../../features/groupSlice";
import { getGroups, createGroup } from "../../../api/groups";
import { useGroupCtx } from "..";
import GroupsTablet from "../tablet/GroupsTablet";
import GroupsMobile from "../mobile/GroupsMobile";
import GroupsList from "./GroupsList";
import GroupDetail from "./GroupDetail";

const NewGroupModal = ({
  onCreate,
  onClose,
}: {
  onCreate: (name: string) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
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
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const Groups = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();
  const { isTablet, isMobile } = useAppSelector((state) => state.app);
  const [selectedGroup, setSelectedGroupLocal] = useState<Group | null>(null);
  const [search, setSearch] = useState("");
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  // These two effects only matter for the isTablet/isMobile fallback below —
  // GroupsTablet/GroupsMobile still switch their own internal view off the
  // shared selectedForm/createInput/storesWithGroupStatus slice fields, so
  // this reset-on-tab-change behavior has to stay intact for them even
  // though the new desktop view below never reads those fields itself.
  useEffect(() => {
    dispatch(setSelectedForm("create"));
    return () => {
      dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
      dispatch(setCreateInput(""));
      dispatch(setStoresWithGroupStatus([]));
      dispatch(setSelectedForm(""));
    };
  }, []);

  useEffect(() => {
    dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
    dispatch(setCreateInput(""));
    dispatch(setStoresWithGroupStatus([]));
  }, [ctx.selectedForm]);

  useEffect(() => {
    if (ctx.refreshGroups) getData();
  }, [ctx.token, ctx.refreshGroups]);

  const getData = () => {
    getGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const groups = j.groups.filter((g: Group) => g.userid === ctx.userid);
          dispatch(setGroups(groups));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setRefreshGroups(false)));
  };

  const handleFormSelect = (formType: GroupFormType) => {
    dispatch(setSelectedForm(formType));
  };

  if (isTablet) return <GroupsTablet handleFormSelect={handleFormSelect} />;
  if (isMobile) return <GroupsMobile handleFormSelect={handleFormSelect} />;

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
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center bg-bkg">
      <div className="w-fit max-w-[95vw] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start">
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            Store Groups
          </span>
        </div>

        <div className="flex min-h-0 max-h-[520px] w-[820px]">
          <GroupsList
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
        </div>

        {showNewGroupModal && (
          <NewGroupModal
            onCreate={handleCreateGroup}
            onClose={() => setShowNewGroupModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Groups;
