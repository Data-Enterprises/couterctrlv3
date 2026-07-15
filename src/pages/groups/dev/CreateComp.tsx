import { useAppDispatch } from "../../../hooks";
import { useGroupCtx } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import { setCreateInput, setRefreshGroups } from "../../../features/groupSlice";
import { createGroup } from "../../../api/groups";
import type { JsonError } from "../../../interfaces";
import GroupPicker from "./GroupPicker";

const CreateComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();

  const handleReset = () => {
    dispatch(setCreateInput(""));
  };

  const handleCreateGroup = () => {
    createGroup(ctx.url, ctx.token, ctx.userid, ctx.createInput.trim())
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setRefreshGroups(true));
          handleReset();
          toast.success("Group created successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const alreadyExists = ctx.groups.some(
    (g) =>
      g.group_name.toLowerCase() === ctx.createInput.trim().toLowerCase() &&
      ctx.createInput.trim() !== "",
  );

  const canSubmit = ctx.createInput.trim() !== "" && !alreadyExists;
  const canClear = ctx.createInput !== "";

  return (
    <div className="flex flex-1 min-h-0">
      <GroupPicker
        groups={ctx.groups}
        mode="reference"
        collisionName={ctx.createInput}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-y-auto thin-scrollbar">
        <div className="w-full max-w-xs">
          <div className="text-[13px] font-semibold text-content mb-0.5 text-center">
            New group
          </div>
          <div className="text-[12px] text-content mb-4 text-center">
            Fill in the details below
          </div>

          <div className="relative">
            <Input
              label="Group name"
              value={ctx.createInput}
              setValue={(v) => dispatch(setCreateInput(v))}
              className="py-1.5 text-[13px]"
            />
            {alreadyExists && (
              <div className="text-[10px] text-red-600 mt-1">
                Group name already exists
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 mt-5">
            <button
              onClick={handleCreateGroup}
              disabled={!canSubmit}
              className={`w-full text-[12px] font-medium py-2 rounded-md transition-colors text-custom-white ${
                canSubmit
                  ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Create group
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

export default CreateComp;
