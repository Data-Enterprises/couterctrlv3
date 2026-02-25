import { useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../hooks";
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

const Groups = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const group = useAppSelector((state) => state.group);

  useEffect(() => {
    dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
    dispatch(setCreateInput(""));
    dispatch(setStoresWithGroupStatus([]));
  }, [group.selectedForm]);

  useEffect(() => {
    if (group.refreshGroups) getData();
  }, [context.token, group.refreshGroups]);

  const getData = () => {
    getGroups(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const groups = j.groups.filter(
            (g: Group) => g.userid === user.userid,
          );
          dispatch(setGroups(groups));
          dispatch(setRefreshGroups(false));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });
  };

  const handleFormSelect = (formType: GroupFormType) => {
    dispatch(setSelectedForm(formType));
  };

  const containerStyle = context.isDesktop
    ? "h-[calc(100vh-3rem)] p-4 space-y-4"
    : "w-full h-[calc(100vh-3rem)] p-2 flex flex-col gap-2";

  const renderForm = () => {
    switch (group.selectedForm) {
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

  return (
    <div className={containerStyle} data-testid="groups-page">
      <div className="bg-custom-white rounded-lg shadow-lg p-4 grid grid-cols-4 gap-4 w-[55%]">
        <button
          className={`${group.selectedForm === "create" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("create")}
        >
          Create
        </button>
        <button
          className={`${group.selectedForm === "update" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("update")}
        >
          Update
        </button>
        <button
          className={`${group.selectedForm === "delete" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("delete")}
        >
          Delete
        </button>
        <button
          className={`${group.selectedForm === "assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("assign")}
        >
          Assign/Unassign Stores
        </button>
      </div>
      {renderForm()}
    </div>
  );
};

export default Groups;
