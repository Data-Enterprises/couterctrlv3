import { useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useGroupCtx } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCreateInput,
  setRefreshGroups,
  setSelectedGroup,
} from "../../../features/groupSlice";
import { deleteGroup } from "../../../api/groups";
import type { JsonError } from "../../../interfaces";
import GroupPicker from "./GroupPicker";

const DeleteComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReset = () => {
    dispatch(setSelectedGroup({ id: 0, userid: 0, group_name: "" }));
    dispatch(setCreateInput(""));
    setIsDeleting(false);
  };

  const handleSelect = (id: number) => {
    const group = ctx.groups.find((g) => g.id === id);
    if (!group) return;
    if (ctx.selectedGroup.id === group.id) {
      handleReset();
    } else {
      dispatch(setSelectedGroup(group));
      setIsDeleting(false);
    }
  };

  const handleDeleteGroup = () => {
    deleteGroup(ctx.url, ctx.token, ctx.selectedGroup.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setRefreshGroups(true));
          handleReset();
          toast.success("Group deleted successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const { id, group_name } = ctx.selectedGroup;

  return (
    <div className="flex flex-1 min-h-0">
      <GroupPicker
        groups={ctx.groups}
        mode="select"
        selectedId={id}
        onSelect={handleSelect}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-y-auto thin-scrollbar">
        <div className="w-full max-w-xs">
          {id > 0 ? (
            <>
              <div className="text-[13px] font-semibold text-content mb-0.5 text-center">
                {group_name}
              </div>
              <div className="text-[12px] text-content mb-4 text-center">
                Select a group to delete
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-content mb-0.5 text-center">
                Select a group
              </div>
              <div className="text-[12px] text-content mb-4 text-center">
                Pick a group from the list to delete
              </div>
            </>
          )}

          <div className="w-full">
            <div className="flex justify-between text-[11px] md:text-[13px] items-end pr-1.5 leading-tight">
              <label className="font-medium pl-0.5">Group name</label>
            </div>
            <input
              type="text"
              readOnly
              value={group_name}
              className="basic-input focus:border w-full bg-custom-white py-1.5 text-[13px]"
            />
          </div>

          {!isDeleting && (
            <div className="flex flex-col items-center gap-2 mt-5">
              <button
                onClick={() => setIsDeleting(true)}
                disabled={id === 0}
                className={`w-full text-[12px] font-medium py-2 rounded-md transition-colors text-custom-white ${
                  id > 0
                    ? "bg-red-600 hover:bg-red-600/85"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Delete
              </button>
              <button
                onClick={handleReset}
                disabled={id === 0}
                className="text-[12px] text-content disabled:opacity-40 transition-colors"
              >
                Reset fields
              </button>
            </div>
          )}

          {isDeleting && (
            <div className="border border-red-300 bg-red-50 rounded-lg px-3.5 py-3 mt-5">
              <div className="text-[12px] text-red-800 mb-2.5 text-center">
                Delete {group_name}? This can't be undone.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteGroup}
                  className="flex-1 text-[12px] font-medium py-1.5 rounded-md bg-red-600 hover:bg-red-600/85 text-custom-white transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 text-[12px] font-medium py-1.5 rounded-md bg-custom-white border border-gray-200 text-content transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteComp;
