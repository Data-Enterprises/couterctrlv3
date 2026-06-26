import { useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppDispatch, useAppSelector } from "../../hooks";
import type { JsonError } from "../../interfaces";

import {
  setCreateInput,
  setGroups,
  setRefreshGroups,
  setSelectedForm,
  setSelectedGroup,
  setStoresWithGroupStatus,
  type Group,
  type GroupFormType,
} from "../../features/groupSlice";

import { getGroups } from "../../api/groups";

import CreateUserGroup from "./forms/CreateUserGroup";
import UpdateUserGroup from "./forms/UpdateUserGroup";
import DeleteUserGroup from "./forms/DeleteUserGroup";
import UserGroupAssign from "./forms/UserGroupAssign";
import { useGroupCtx } from ".";
import GroupsTablet from "./tablet/GroupsTablet";
import GroupsMobile from "./mobile/GroupsMobile";

import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/solid";

const NAV_ITEMS: { id: GroupFormType; label: string; Icon: React.ElementType }[] = [
  { id: "create", label: "New", Icon: PlusCircleIcon },
  { id: "update", label: "Rename", Icon: PencilIcon },
  { id: "delete", label: "Delete", Icon: TrashIcon },
  { id: "assign", label: "Assign", Icon: BuildingStorefrontIcon },
];

const Groups = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();
  const { isTablet, isMobile } = useAppSelector((state) => state.app);

  useEffect(() => {
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
      .catch((err: JsonError) => {
        toast.error(err.message);
      })
      .finally(() => dispatch(setRefreshGroups(false)));
  };

  const handleFormSelect = (formType: GroupFormType) => {
    dispatch(setSelectedForm(formType));
  };

  if (isTablet) return <GroupsTablet handleFormSelect={handleFormSelect} />;
  if (isMobile) return <GroupsMobile handleFormSelect={handleFormSelect} />;

  const cardWidth = ctx.selectedForm === "assign" ? 560 : 420;

  const renderForm = () => {
    switch (ctx.selectedForm) {
      case "create": return <CreateUserGroup bare />;
      case "update": return <UpdateUserGroup bare />;
      case "delete": return <DeleteUserGroup bare />;
      case "assign": return <UserGroupAssign bare />;
      default: return (
        <div className="p-8 text-[11px] text-content/35 text-center">Select an action above</div>
      );
    }
  };

  return (
    <div className="h-[calc(100vh-3rem)] p-4 flex items-center justify-center" data-testid="groups-page">
      <div
        className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
        style={{ width: cardWidth, transition: "width 200ms ease" }}
      >
        {/* Unified navy header with tabs */}
        <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex items-center justify-between gap-4" style={{ background: "#1e2a4a" }}>
          <span className="text-[13px] font-semibold text-white">Groups</span>
          <div className="flex gap-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = ctx.selectedForm === id;
              return (
                <button
                  key={id}
                  data-testid={`user-group-${id}-form-btn`}
                  onClick={() => handleFormSelect(id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors select-none"
                  style={{
                    background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)",
                    color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {renderForm()}
      </div>
    </div>
  );
};

export default Groups;
