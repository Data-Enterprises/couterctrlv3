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

  const renderForm = () => {
    switch (ctx.selectedForm) {
      case "create": return <CreateUserGroup />;
      case "update": return <UpdateUserGroup />;
      case "delete": return <DeleteUserGroup />;
      case "assign": return <UserGroupAssign />;
      default: return null;
    }
  };

  return (
    <div className="h-[calc(100vh-3rem)] p-4 flex gap-3" data-testid="groups-page">
      {/* Side nav */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = ctx.selectedForm === id;
          return (
            <button
              key={id}
              data-testid={`user-group-${id}-form-btn`}
              onClick={() => handleFormSelect(id)}
              className="flex flex-col items-center justify-center gap-1.5 w-[68px] py-3 rounded-xl transition-colors select-none"
              style={{
                background: active ? "#1e2a4a" : "#ffffff",
                border: "none",
                color: active ? "#fff" : "rgba(30,42,74,0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        {renderForm()}
      </div>
    </div>
  );
};

export default Groups;
