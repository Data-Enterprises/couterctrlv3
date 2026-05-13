import { useState } from "react";
import { useGroupCtx } from "..";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";

import {
  setCreateInput,
  setRefreshGroups,
  setSelectedGroup,
  type Group,
} from "../../../features/groupSlice";

import { deleteGroup } from "../../../api/groups";
import Input from "../../../components/inputs/Input";

const DeleteUserGroup = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, groups, selectedGroup, createInput } = useGroupCtx();
  const { isDesktop } = useAppSelector((state) => state.app);

  const handleSelect = (g: Group) => {
    if (selectedGroup.id === g.id) {
      dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
      dispatch(setCreateInput(""));
    } else {
      dispatch(setSelectedGroup(g));
      dispatch(setCreateInput(g.group_name));
    }
  };

  const handleDelete = () => {
    deleteGroup(url, token, selectedGroup.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setRefreshGroups(true));
          dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
          dispatch(setCreateInput(""));
          toast.success("Group deleted successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setIsDeleting(false));
  };

  const canSubmit = () => {
    return createInput.trim() !== "" && selectedGroup.id > 0;
  };

  const cleanup = () => {
    dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
    dispatch(setCreateInput(""));
    setIsDeleting(false);
  };

  const containerStyle = isDesktop
    ? "bg-custom-white p-2 rounded-md shadow-md text-sm"
    : "bg-custom-white p-4 rounded-md shadow-md w-full text-sm";

  return (
    <div className={containerStyle}>
      <div className="font-medium text-sm">
        <div>Select group to delete</div>
      </div>
      <div className="p-2 bg-bkg/80 rounded-lg grid grid-cols-2 max-h-52 overflow-y-auto select-none text-[13px]">
        {groups.map((g, i) => (
          <div
            key={g.id}
            data-testid={`delete-group-option-${i}`}
            className={`${selectedGroup.id === g.id ? "bg-orange-200" : ""} px-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer hover:bg-blue-200`}
            onClick={() => handleSelect(g)}
          >
            {g.group_name}
          </div>
        ))}
      </div>
      <div>
        <Input
          label="Group Name"
          value={createInput}
          setValue={() => {}}
          className="py-1 text-[14px]"
        />
        <button
          data-testid="delete-usergroup-btn"
          className={`btn-themeOrange bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white py-1 text-[13px] mt-2 w-full ${canSubmit() ? "" : "opacity-50 pointer-events-none"}`}
          onClick={() => setIsDeleting(true)}
        >
          Delete
        </button>
      </div>
      {isDeleting ? (
        <div className="text-[13px]">
          <div className="grid grid-cols-2 h-[1.5px] my-1.5">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>
          <div className="text-center">Are you sure you want to delete</div>
          <div className="text-center">
            <span className="pr-1">Base group =</span>
            <span className="font-medium">{selectedGroup.group_name}</span>
            <span>?</span>
          </div>
          <div className="text-content/60 text-center">
            Be advised, this action cannot be undone
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              className="btn-themeGreen bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white py-1 px-0"
              data-testid="delete-submit-btn"
              onClick={handleDelete}
            >
              Yes
            </button>
            <button
              className="btn-themeOrange bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1 px-0"
              data-testid="delete-cancel-btn"
              onClick={cleanup}
            >
              No
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeleteUserGroup;
