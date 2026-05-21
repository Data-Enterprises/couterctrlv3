import { useState } from "react";
import { useGroupCtx } from "..";
import { useAppDispatch } from "../../../hooks";
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

const DeleteGroup = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, groups, selectedGroup, createInput } = useGroupCtx();

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

  return (
    <div>
      <div className="bg-custom-white p-3 rounded-xl shadow-md w-full">
        <div className="font-medium md:text-sm">
          <div>Select group to delete</div>
        </div>
        <div className="md:text-sm p-3 bg-bkg rounded-lg grid grid-cols-3 gap-2 max-h-[50vh] shadow overflow-y-auto select-none">
          {groups.map((g, i) => (
            <div
              key={g.id}
              data-testid={`delete-group-option-${i}`}
              className={`${selectedGroup.id === g.id ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"} rounded-full text-center py-1 shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-200`}
              onClick={() => handleSelect(g)}
            >
              {g.group_name}
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-[67%_1fr] gap-3 items-end mt-4">
          <Input label="Group Name" value={createInput} setValue={() => {}} className="py-1" />
          <button
            data-testid="delete-usergroup-btn"
            className={`bg-red-600 text-custom-white py-2 rounded-xl border-2 border-red-600 mt-2 w-full ${canSubmit() ? "" : "opacity-50 pointer-events-none"}`}
            onClick={() => setIsDeleting(true)}
          >
            Delete
          </button>
        </div>

        {isDeleting ? (
          <div className="">
            <div className="h-[1.5px] grid grid-cols-2 my-3">
              <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
              <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
            </div>
            <div className="text-center">Are you sure you want to delete</div>
            <div className="text-center">
              <span className="pr-1">Base group =</span>
              <span className="font-medium">{selectedGroup.group_name}</span>
              <span>?</span>
            </div>
            <div className="font-medium text-center text-content/60">
              Be advised, this action cannot be undone
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                className={`bg-[rgb(30,45,80)] text-custom-white py-1.5 rounded-xl border-2 border-[rgb(30,45,80)] w-full`}
                data-testid="delete-submit-btn"
                onClick={handleDelete}
              >
                Yes
              </button>
              <button
                className={`bg-red-600 text-custom-white py-1.5 rounded-xl border-2 border-red-600 w-full`}
                data-testid="delete-cancel-btn"
                onClick={cleanup}
              >
                No
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DeleteGroup;
