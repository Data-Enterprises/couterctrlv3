import { useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppDispatch } from "../../hooks";
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

  const containerStyle = ctx.isDesktop
    ? "h-[calc(100vh-3rem)] p-4 space-y-4"
    : "w-full h-[calc(100vh-3rem)] p-2 flex flex-col gap-2";

  const optionBtnStyle = ctx.isDesktop
    ? "bg-custom-white rounded-lg shadow-lg p-2 grid grid-cols-4 gap-2 w-[55%]"
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
        <div className={optionBtnStyle}>
          <button
            data-testid="user-group-create-form-btn"
            className={`${ctx.selectedForm === "create" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleFormSelect("create")}
          >
            Create
          </button>
          <button
            data-testid="user-group-update-form-btn"
            className={`${ctx.selectedForm === "update" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleFormSelect("update")}
          >
            Update
          </button>
          <button
            data-testid="user-group-delete-form-btn"
            className={`${ctx.selectedForm === "delete" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleFormSelect("delete")}
          >
            Delete
          </button>
          <button
            data-testid="user-group-assign-form-btn"
            className={`${ctx.selectedForm === "assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleFormSelect("assign")}
          >
            Assign/Unassign Stores
          </button>
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
      {renderForm()}
    </div>
  );
};

export default Groups;
