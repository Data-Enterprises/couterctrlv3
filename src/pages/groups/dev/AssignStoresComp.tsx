import { useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useGroupCtx } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setSelectedGroup, setStoresWithGroupStatus, updateStoresWithStatus } from "../../../features/groupSlice";
import type { StoreWithGroupStatus } from "../../../features/groupSlice";
import { addStoreToGroup, getStoresAssignedToUserGroup, removeStoreFromGroup } from "../../../api/groups";
import type { JsonError } from "../../../interfaces";
import GroupPicker from "./GroupPicker";
import TextFilter from "../../../components/filters/TextFilter";
import EmptyPrompt from "../../../components/EmptyPrompt";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const filtered = (stores: StoreWithGroupStatus[], filter: string, active: 0 | 1) =>
  stores
    .filter((s) => s.active === active)
    .filter((s) => s.store_name.toLowerCase().includes(filter.toLowerCase()));

const AssignStoresComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [unassignedFilter, setUnassignedFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  const handleSelectGroup = (id: number) => {
    const group = ctx.groups.find((g) => g.id === id);
    if (!group) return;
    dispatch(setSelectedGroup(group));
    dispatch(setStoresWithGroupStatus([]));
    setUnassignedFilter("");
    setAssignedFilter("");
    setIsLoading(true);
    getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const stores = [...j.stores].sort((a: StoreWithGroupStatus, b: StoreWithGroupStatus) => b.active - a.active);
          dispatch(setStoresWithGroupStatus(stores));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const setStorePending = (storeid: number, isPending: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      isPending ? next.add(storeid) : next.delete(storeid);
      return next;
    });
  };

  const handleToggle = (storeid: number, type: "assigned" | "unassigned") => {
    setStorePending(storeid, true);
    const call =
      type === "assigned"
        ? removeStoreFromGroup(ctx.url, ctx.token, ctx.userid, ctx.selectedGroup.id, storeid)
        : addStoreToGroup(ctx.url, ctx.token, ctx.userid, ctx.selectedGroup.id, storeid);

    call
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(updateStoresWithStatus(storeid));
        } else {
          toast.error("Unable to update store assignment");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setStorePending(storeid, false));
  };

  const unassigned = filtered(ctx.storesWithGroupStatus, unassignedFilter, 0);
  const assigned = filtered(ctx.storesWithGroupStatus, assignedFilter, 1);

  return (
    <div className="flex flex-1 min-h-0">
      <GroupPicker groups={ctx.groups} mode="select" selectedId={ctx.selectedGroup.id} onSelect={handleSelectGroup} />

      {ctx.selectedGroup.id === 0 ? (
        <div className="flex-1 min-h-[260px] p-5">
          <EmptyPrompt title="No group selected" description="Select a group to assign or unassign stores" />
        </div>
      ) : isLoading ? (
        <div className="flex-1 min-h-[260px] relative">
          <LoadingIndicator message="Loading stores" />
        </div>
      ) : (
        <div className="flex flex-1 min-w-0 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col border-r border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
              <TextFilter value={unassignedFilter} onChange={setUnassignedFilter} placeholder="Search unassigned…" />
            </div>
            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content bg-gray-50 flex-shrink-0">
              Unassigned ({unassigned.length})
            </div>
            <div className="max-h-72 overflow-y-auto thin-scrollbar">
              {unassigned.map((s) => (
                <div
                  key={s.storeid}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-[12px] text-content border-b border-gray-100 ${pending.has(s.storeid) ? "opacity-40" : ""}`}
                >
                  <span className="truncate">{s.store_name}</span>
                  <button
                    onClick={() => handleToggle(s.storeid, "unassigned")}
                    disabled={pending.has(s.storeid)}
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[13px] font-semibold text-[#1e2a4a] border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              ))}
              {unassigned.length === 0 && (
                <div className="flex items-center justify-center py-8 text-[12px] text-content">No stores found</div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
              <TextFilter value={assignedFilter} onChange={setAssignedFilter} placeholder="Search assigned…" />
            </div>
            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content bg-gray-50 flex-shrink-0">
              Assigned ({assigned.length})
            </div>
            <div className="max-h-72 overflow-y-auto thin-scrollbar">
              {assigned.map((s) => (
                <div
                  key={s.storeid}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-[12px] text-content border-b border-gray-100 ${pending.has(s.storeid) ? "opacity-40" : ""}`}
                >
                  <span className="truncate">{s.store_name}</span>
                  <button
                    onClick={() => handleToggle(s.storeid, "assigned")}
                    disabled={pending.has(s.storeid)}
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[13px] font-semibold text-red-600 border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                </div>
              ))}
              {assigned.length === 0 && (
                <div className="flex items-center justify-center py-8 text-[12px] text-content">No stores found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignStoresComp;
