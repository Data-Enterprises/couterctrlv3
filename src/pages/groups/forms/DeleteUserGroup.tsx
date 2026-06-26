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
import { CheckIcon } from "@heroicons/react/20/solid";

const DeleteUserGroup = ({ bare }: { bare?: boolean }) => {
  const [isDeleting, setIsDeleting] = useState(false);
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
    setIsDeleting(false);
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

  const cleanup = () => {
    dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
    dispatch(setCreateInput(""));
    setIsDeleting(false);
  };

  const canSubmit = createInput.trim() !== "" && selectedGroup.id > 0;

  if (!isDesktop) {
    return (
      <div className="bg-custom-white p-4 rounded-md shadow-md w-full text-sm">
        <div className="font-medium mb-2">Select group to delete</div>
        <div className="p-2 bg-bkg/80 rounded-lg grid grid-cols-2 max-h-52 overflow-y-auto select-none text-[13px] mb-2">
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
        <button
          data-testid="delete-usergroup-btn"
          className={`btn-themeOrange bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white py-1 text-[13px] mt-1 w-full ${canSubmit ? "" : "opacity-50 pointer-events-none"}`}
          onClick={() => setIsDeleting(true)}
        >
          Delete
        </button>
        {isDeleting && (
          <div className="mt-3 text-[13px] text-center">
            <div>Are you sure you want to delete <strong>{selectedGroup.group_name}</strong>?</div>
            <div className="text-content/60 text-[12px] mt-0.5">This cannot be undone.</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button className="btn-themeGreen bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white py-1 px-0" data-testid="delete-submit-btn" onClick={handleDelete}>Yes</button>
              <button className="btn-themeOrange bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1 px-0" data-testid="delete-cancel-btn" onClick={cleanup}>No</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const body = (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-content/40 mb-1.5">Select group</div>
        <div className="flex flex-col rounded-lg border border-gray-100 overflow-hidden max-h-48 overflow-y-auto thin-scrollbar">
          {groups.map((g, i) => {
            const isSel = selectedGroup.id === g.id;
            return (
              <button
                key={g.id}
                data-testid={`delete-group-option-${i}`}
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

      <button
        data-testid="delete-usergroup-btn"
        onClick={() => setIsDeleting(true)}
        className={`w-full text-[11px] font-semibold text-white rounded-lg px-4 py-1.5 transition-colors ${canSubmit ? "hover:opacity-90" : "opacity-40 pointer-events-none"}`}
        style={{ background: "#dc2626" }}
      >
        Delete group
      </button>

      {isDeleting && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex flex-col gap-2">
          <div className="text-[11px] text-content text-center">
            Delete <span className="font-semibold">{selectedGroup.group_name}</span>?
          </div>
          <div className="text-[10px] text-content/50 text-center">This cannot be undone.</div>
          <div className="flex gap-2 justify-center mt-1">
            <button
              onClick={cleanup}
              className="text-[11px] font-medium rounded-lg px-4 py-1.5 border border-gray-200 bg-custom-white text-content hover:bg-gray-50 transition-colors"
              data-testid="delete-cancel-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="text-[11px] font-semibold text-white rounded-lg px-4 py-1.5 hover:opacity-90 transition-colors"
              style={{ background: "#dc2626" }}
              data-testid="delete-submit-btn"
            >
              Yes, delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (bare) return body;

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ width: 280 }}>
      <div className="flex-shrink-0 px-3 pt-1 pb-2.5" style={{ background: "#1e2a4a" }}>
        <span className="text-[13px] font-semibold text-white">Delete group</span>
      </div>
      {body}
    </div>
  );
};

export default DeleteUserGroup;
