import { useEffect } from "react";
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
import { getGroups } from "../../../api/groups";
import { useGroupCtx } from "..";
import GroupsTablet from "../tablet/GroupsTablet";
import GroupsMobile from "../mobile/GroupsMobile";
import CreateComp from "./CreateComp";
import UpdateComp from "./UpdateComp";
import DeleteComp from "./DeleteComp";
import AssignStoresComp from "./AssignStoresComp";

const TABS: { id: GroupFormType; label: string }[] = [
  { id: "create", label: "Create" },
  { id: "update", label: "Update" },
  { id: "delete", label: "Delete" },
  { id: "assign", label: "Assign stores" },
];

const Groups = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();
  const { isTablet, isMobile } = useAppSelector((state) => state.app);

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

  const renderActiveTab = () => {
    switch (ctx.selectedForm) {
      case "create":
        return <CreateComp />;
      case "update":
        return <UpdateComp />;
      case "delete":
        return <DeleteComp />;
      case "assign":
        return <AssignStoresComp />;
      default:
        return null;
    }
  };

  const assignedCount = ctx.storesWithGroupStatus.filter((s) => s.active === 1).length;

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div className="w-full max-w-3xl flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start">
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-white font-semibold text-[13px] flex-shrink-0">Groups</span>
          {ctx.selectedForm === "assign" && ctx.selectedGroup.id > 0 && (
            <>
              <span className="text-white/45 text-[10px] flex-shrink-0">{ctx.selectedGroup.group_name}</span>
              <div className="flex-1" />
              <span className="text-white/45 text-[10px] uppercase tracking-wide">Assigned</span>
              <span className="text-white text-[12px] font-medium">{assignedCount}</span>
            </>
          )}
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setSelectedForm(tab.id))}
              className={`text-[12px] font-semibold py-2.5 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
                ctx.selectedForm === tab.id
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Groups;
