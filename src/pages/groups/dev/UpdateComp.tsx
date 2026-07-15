import { useAppDispatch } from "../../../hooks";
import { useGroupCtx } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import {
  setCreateInput,
  setRefreshGroups,
  setSelectedGroup,
} from "../../../features/groupSlice";
import { updateGroup } from "../../../api/groups";
import type { JsonError } from "../../../interfaces";
import GroupPicker from "./GroupPicker";

const UpdateComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();

  const handleReset = () => {
    dispatch(setSelectedGroup({ id: 0, userid: 0, group_name: "" }));
    dispatch(setCreateInput(""));
  };

  const handleSelect = (id: number) => {
    const group = ctx.groups.find((g) => g.id === id);
    if (!group) return;
    if (ctx.selectedGroup.id === group.id) {
      handleReset();
    } else {
      dispatch(setSelectedGroup(group));
      dispatch(setCreateInput(group.group_name));
    }
  };

  const handleUpdateGroup = () => {
    updateGroup(
      ctx.url,
      ctx.token,
      ctx.userid,
      ctx.selectedGroup.id,
      ctx.createInput.trim(),
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setRefreshGroups(true));
          handleReset();
          toast.success("Group updated successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const { id, group_name } = ctx.selectedGroup;

  const canSubmit = id > 0 && ctx.createInput.trim() !== "";
  const canClear = id > 0 || ctx.createInput !== "";

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
                Update group name
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-content mb-0.5 text-center">
                Select a group
              </div>
              <div className="text-[12px] text-content mb-4 text-center">
                Pick a group from the list to update
              </div>
            </>
          )}

          <Input
            label="Group name"
            value={ctx.createInput}
            setValue={(v) => dispatch(setCreateInput(v))}
            className="py-1.5 text-[13px]"
          />

          <div className="flex flex-col items-center gap-2 mt-5">
            <button
              onClick={handleUpdateGroup}
              disabled={!canSubmit}
              className={`w-full text-[12px] font-medium py-2 rounded-md transition-colors text-custom-white ${
                canSubmit
                  ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Save changes
            </button>
            <button
              onClick={handleReset}
              disabled={!canClear}
              className="text-[12px] text-content disabled:opacity-40 transition-colors"
            >
              Reset fields
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateComp;
