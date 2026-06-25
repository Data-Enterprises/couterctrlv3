import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCreateInput,
  setRefreshGroups,
  setSelectedGroup,
  type Group,
} from "../../../features/groupSlice";
import type { JsonError } from "../../../interfaces";
import { updateGroup } from "../../../api/groups";
import { useGroupCtx } from "..";
import { CheckIcon } from "@heroicons/react/20/solid";

const UpdateUserGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, selectedGroup, createInput } = useGroupCtx();
  const { isDesktop } = useAppSelector((state) => state.app);

  const groupNames = groups.map((g) => g.group_name);

  const handleSelect = (g: Group) => {
    dispatch(setSelectedGroup(g));
    dispatch(setCreateInput(g.group_name));
  };

  const handleUpdate = () => {
    updateGroup(url, token, userid, selectedGroup.id, createInput)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group updated successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const canSubmit =
    createInput.trim() !== "" &&
    selectedGroup.id > 0 &&
    !groupNames.some((g) => g.toLowerCase() === createInput.trim().toLowerCase());

  if (!isDesktop) {
    return (
      <div className="bg-custom-white p-4 rounded-md shadow-md w-full text-sm">
        <div className="font-medium mb-2">Select group to update</div>
        <div className="p-2 bg-bkg/80 rounded-lg grid grid-cols-2 max-h-52 overflow-y-auto select-none text-[13px] mb-2">
          {groups.map((g, i) => (
            <div
              key={g.id}
              data-testid={`update-group-option-${i}`}
              className={`${selectedGroup.id === g.id ? "bg-orange-200" : ""} px-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer hover:bg-blue-200`}
              onClick={() => handleSelect(g)}
            >
              {g.group_name}
            </div>
          ))}
        </div>
        <input
          value={createInput}
          onChange={(e) => dispatch(setCreateInput(e.target.value))}
          placeholder="New name"
          className="basic-input w-full py-1 text-[14px] mb-2"
        />
        <button
          data-testid="create-usergroup-btn"
          className={`btn-themeBlue mt-1 w-full bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1 text-[13px] ${canSubmit ? "" : "opacity-50 pointer-events-none"}`}
          onClick={handleUpdate}
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ width: 280 }}>
      <div className="flex-shrink-0 px-3 py-1.5" style={{ background: "#1e2a4a" }}>
        <span className="text-[13px] font-semibold text-white">Rename group</span>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-content/40 mb-1.5">Select group</div>
          <div className="flex flex-col rounded-lg border border-gray-100 overflow-hidden max-h-48 overflow-y-auto thin-scrollbar">
            {groups.map((g, i) => {
              const isSel = selectedGroup.id === g.id;
              return (
                <button
                  key={g.id}
                  data-testid={`update-group-option-${i}`}
                  onClick={() => handleSelect(g)}
                  className="flex items-center justify-between px-3 py-2 text-[11px] border-b border-gray-100 last:border-b-0 text-left transition-colors"
                  style={{
                    background: isSel ? "#1e2a4a" : "var(--color-background-primary)",
                    color: isSel ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  <span>{g.group_name}</span>
                  {isSel && (
                    <span className="flex items-center justify-center w-[14px] h-[14px] rounded-[3px] border border-white/30 flex-shrink-0">
                      <CheckIcon className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] font-semibold uppercase tracking-wide text-content/40">New name</label>
          <input
            value={createInput}
            onChange={(e) => dispatch(setCreateInput(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleUpdate()}
            placeholder="Enter new name…"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-content bg-custom-white"
            style={{ outline: "none" }}
          />
        </div>

        <button
          data-testid="create-usergroup-btn"
          onClick={handleUpdate}
          className={`w-full text-[11px] font-semibold text-white rounded-lg px-4 py-1.5 transition-colors ${canSubmit ? "hover:opacity-90" : "opacity-40 pointer-events-none"}`}
          style={{ background: "#1e2a4a" }}
        >
          Save changes
        </button>
      </div>
    </div>
  );
};

export default UpdateUserGroup;
