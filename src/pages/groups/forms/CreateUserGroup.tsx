import { useGroupCtx } from "..";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";

import { setCreateInput, setRefreshGroups } from "../../../features/groupSlice";
import { createGroup } from "../../../api/groups";

const CreateUserGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, createInput } = useGroupCtx();
  const { isDesktop } = useAppSelector((state) => state.app);

  const groupNames = groups.map((g) => g.group_name);
  const isDuplicate = groupNames.some((g) => g.toLowerCase() === createInput.trim().toLowerCase());
  const canSubmit = createInput.trim() !== "" && !isDuplicate;

  const handleCreate = () => {
    createGroup(url, token, userid, createInput)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group created successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  if (!isDesktop) {
    return (
      <div className="bg-custom-white p-4 rounded-md shadow-md w-full text-sm" data-testid="create-usergroup-form">
        <div className="font-medium mb-2">Existing Groups</div>
        <div className="p-2 bg-bkg/80 rounded-lg grid grid-cols-2 max-h-52 overflow-y-auto select-none text-[13px] mb-2">
          {groupNames.map((g, i) => (
            <div key={i} className={`${createInput.trim().toLowerCase() === g.toLowerCase() ? "bg-orange-200" : ""} px-2 py-0.5 rounded-full`}>{g}</div>
          ))}
        </div>
        {isDuplicate && <div className="font-medium text-orange-500 text-[10.5px] mb-1">Group already exists. Please use another name.</div>}
        <input
          data-testid="input-group-name"
          value={createInput}
          onChange={(e) => dispatch(setCreateInput(e.target.value))}
          placeholder="Group name"
          className="basic-input w-full py-1 text-[12px] mb-2"
        />
        <button
          data-testid="create-usergroup-btn"
          className={`btn-themeBlue mt-1 w-full bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1 text-[13px] ${canSubmit ? "" : "opacity-50 pointer-events-none"}`}
          onClick={handleCreate}
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ width: 280 }} data-testid="create-usergroup-form">
      <div className="flex-shrink-0 px-3 py-1.5" style={{ background: "#1e2a4a" }}>
        <span className="text-[13px] font-semibold text-white">New group</span>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-content/40 mb-1.5">Existing groups</div>
          <div className="flex flex-col rounded-lg border border-gray-100 overflow-hidden max-h-48 overflow-y-auto thin-scrollbar">
            {groupNames.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-content/40">No groups yet</div>
            ) : groupNames.map((g, i) => (
              <div
                key={i}
                className="px-3 py-2 text-[11px] text-content border-b border-gray-100 last:border-b-0"
              >
                {g}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] font-semibold uppercase tracking-wide text-content/40">Group name</label>
          <input
            data-testid="input-group-name"
            value={createInput}
            onChange={(e) => dispatch(setCreateInput(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleCreate()}
            placeholder="e.g. Pacific Northwest…"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-content bg-custom-white focus:outline-none focus:border-[#1e2a4a]/40"
            style={{ outline: "none" }}
          />
          {isDuplicate && (
            <span className="text-[10px] text-red-500 mt-0.5">A group with this name already exists.</span>
          )}
        </div>

        <button
          data-testid="create-usergroup-btn"
          onClick={handleCreate}
          className={`w-full text-[11px] font-semibold text-white rounded-lg px-4 py-1.5 transition-colors ${canSubmit ? "hover:opacity-90" : "opacity-40 pointer-events-none"}`}
          style={{ background: "#1e2a4a" }}
        >
          Create group
        </button>
      </div>
    </div>
  );
};

export default CreateUserGroup;
