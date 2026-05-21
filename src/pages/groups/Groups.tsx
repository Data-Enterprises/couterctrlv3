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
import SingleSelect from "../../components/SingleSelect";
import GroupsTablet from "./tablet/GroupsTablet";
import GroupsMobile from "./mobile/GroupsMobile";

const options = [
  { label: "Create", id: "create" },
  { label: "Update", id: "update" },
  { label: "Delete", id: "delete" },
  { label: "Assign/Unassign Stores", id: "assign" },
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

  const containerStyle = ctx.isDesktop
    ? "h-[calc(100vh-3rem)] p-4 flex gap-4"
    : "w-full h-[calc(100vh-3rem)] p-2 flex flex-col gap-2";

  const optionBtnStyle = ctx.isDesktop
    ? "bg-custom-white rounded-lg shadow-lg min-w-36 text-sm select-none"
    : "bg-custom-white rounded-lg shadow-lg p-2 grid gap-2";

  const renderForm = () => {
    switch (ctx.selectedForm) {
      case "create":
        return <CreateUserGroup />;
      case "update":
        return <UpdateUserGroup />;
      case "delete":
        return <DeleteUserGroup />;
      case "assign":
        return <UserGroupAssign />;
      default:
        return null;
    }
  };

  const handleMobileFormSelect = (id: string | number) => {
    const val: GroupFormType = id.toString() as GroupFormType;
    dispatch(setSelectedForm(val));
  };

  return (
    <div className={containerStyle} data-testid="groups-page">
      {ctx.isDesktop ? (
        <div>
          <div className={optionBtnStyle}>
            <div className="font-medium px-2 rounded-t-lg py-0.5">
              User Group Forms
            </div>
            <div className="grid grid-cols-2">
              <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
              <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
            </div>
            <div
              data-testid="user-group-create-form-btn"
              className={`${ctx.selectedForm === "create" ? "bg-orange-200" : "bg-custom-white"} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
              onClick={() => handleFormSelect("create")}
            >
              Create
            </div>
            <div
              data-testid="user-group-update-form-btn"
              className={`${ctx.selectedForm === "update" ? "bg-orange-200" : "bg-custom-white"} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
              onClick={() => handleFormSelect("update")}
            >
              Update
            </div>
            <div
              data-testid="user-group-delete-form-btn"
              className={`${ctx.selectedForm === "delete" ? "bg-orange-200" : "bg-custom-white"} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
              onClick={() => handleFormSelect("delete")}
            >
              Delete
            </div>
            <div
              data-testid="user-group-assign-form-btn"
              className={`${ctx.selectedForm === "assign" ? "bg-orange-200" : "bg-custom-white"} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2 rounded-b-lg`}
              onClick={() => handleFormSelect("assign")}
            >
              Assign/Unassign Stores
            </div>
          </div>
        </div>
      ) : (
        <SingleSelect
          label="Forms"
          data={options}
          displayKey="label"
          valueKey="id"
          onSelect={handleMobileFormSelect}
        />
      )}
      <div>{renderForm()}</div>
    </div>
  );
};

export default Groups;
