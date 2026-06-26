import { useState } from "react";
import { useGroupCtx } from "..";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setSelectedGroup,
  setStoresWithGroupStatus,
  updateStoresWithStatus,
  type StoreWithGroupStatus,
} from "../../../features/groupSlice";
import type { JsonError } from "../../../interfaces";
import {
  addStoreToGroup,
  getStoresAssignedToUserGroup,
  removeStoreFromGroup,
} from "../../../api/groups";
import SelectFilter from "../../../components/filters/SelectFilter";

const UserGroupAssign = ({ bare }: { bare?: boolean }) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, selectedGroup, storesWithGroupStatus } = useGroupCtx();
  const { isDesktop } = useAppSelector((state) => state.app);

  const [unassignedFilter, setUnassignedFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  const getGroupStores = (id: number) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    dispatch(setStoresWithGroupStatus([]));
    dispatch(setSelectedGroup(group));
    getStoresAssignedToUserGroup(url, token, userid, id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const stores = [...j.stores].sort((a, b) => b.active - a.active);
          dispatch(setStoresWithGroupStatus(stores));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const filtered = (stores: StoreWithGroupStatus[], filter: string, active: 0 | 1) =>
    stores.filter(
      (s) => s.active === active && s.store_name.toLowerCase().includes(filter.toLowerCase()),
    );

  const handleStoreClick = (storeid: number, type: "assigned" | "unassigned") => {
    if (type === "assigned") {
      removeStoreFromGroup(url, token, userid, selectedGroup.id, storeid).catch(
        (err: JsonError) => toast.error(err.message),
      );
    } else {
      addStoreToGroup(url, token, userid, selectedGroup.id, storeid).catch(
        (err: JsonError) => toast.error(err.message),
      );
    }
    dispatch(updateStoresWithStatus(storeid));
  };

  const unassigned = filtered(storesWithGroupStatus, unassignedFilter, 0);
  const assigned = filtered(storesWithGroupStatus, assignedFilter, 1);

  if (!isDesktop) {
    return (
      <div>
        <div className="bg-custom-white rounded-lg shadow-md p-3">
          <select
            className="w-full border rounded p-2 text-sm mb-3"
            value={selectedGroup.id || ""}
            onChange={(e) => getGroupStores(Number(e.target.value))}
          >
            <option value="">Select User Group</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-1/2 bg-slate-100 p-3 rounded-lg shadow-md">
              <input value={unassignedFilter} onChange={(e) => setUnassignedFilter(e.target.value)} placeholder={`Unassigned — ${unassigned.length}`} className="basic-input w-full mb-2" />
              <div className="space-y-2 max-h-[calc(100vh-17rem)] overflow-y-scroll no-scrollbar">
                {unassigned.map((store) => (
                  <div key={store.storeid} data-testid={`unassigned-store-${store.storeid}`} className="bg-custom-white flex items-start justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 transition-all" onClick={() => handleStoreClick(store.storeid, "unassigned")}>
                    <div className="font-medium text-[12px]"><div>Store {store.store_number}</div><div>{store.storeid} - {store.store_name}</div></div>
                    <div className="bg-red-600 text-custom-white px-2 py-0.5 rounded-full text-[12px]">Inactive</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-1/2 bg-slate-100 p-3 rounded-lg shadow-md">
              <input value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)} placeholder={`Assigned — ${assigned.length}`} className="basic-input w-full mb-2" />
              <div className="space-y-2 max-h-[calc(100vh-17rem)] overflow-y-scroll no-scrollbar">
                {assigned.map((store) => (
                  <div key={store.storeid} data-testid={`assigned-store-${store.storeid}`} className="bg-custom-white flex items-start justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 transition-all" onClick={() => handleStoreClick(store.storeid, "assigned")}>
                    <div className="font-medium text-[12px]"><div>Store {store.store_number}</div><div>{store.storeid} - {store.store_name}</div></div>
                    <div className="bg-[rgb(30,45,80)] text-custom-white px-2 py-0.5 rounded-full text-[12px]">Active</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const body = (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-0.5">
        <label className="text-[9px] font-semibold uppercase tracking-wide text-content/40">Group</label>
        <SelectFilter
          options={groups.map((g) => ({ value: String(g.id), label: g.group_name }))}
          value={selectedGroup.id ? String(selectedGroup.id) : ""}
          onChange={(v) => v && getGroupStores(Number(v))}
          placeholder="Select a group…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-content/40">Unassigned</span>
            <span className="text-[10px] text-content/35">{unassigned.length}</span>
          </div>
          <input
            value={unassignedFilter}
            onChange={(e) => setUnassignedFilter(e.target.value)}
            placeholder="Filter stores…"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-content bg-custom-white"
            style={{ outline: "none" }}
          />
          <div className="flex flex-col gap-1 max-h-96 overflow-y-auto thin-scrollbar">
            {unassigned.length === 0 ? (
              <div className="text-[10px] text-content/35 text-center py-4">
                {selectedGroup.id > 0 ? "All stores assigned" : "Select a group first"}
              </div>
            ) : unassigned.map((store) => (
              <button
                key={store.storeid}
                data-testid={`unassigned-store-${store.storeid}`}
                onClick={() => handleStoreClick(store.storeid, "unassigned")}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-gray-100 bg-custom-white hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <div className="text-[10px] font-medium text-content">Store {store.store_number}</div>
                  <div className="text-[9px] text-content/50">{store.store_name}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0" style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }}>
                  Unassigned
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-content/40">Assigned</span>
            <span className="text-[10px] text-content/35">{assigned.length}</span>
          </div>
          <input
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            placeholder="Filter stores…"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-content bg-custom-white"
            style={{ outline: "none" }}
          />
          <div className="flex flex-col gap-1 max-h-96 overflow-y-auto thin-scrollbar">
            {assigned.length === 0 ? (
              <div className="text-[10px] text-content/35 text-center py-4">
                {selectedGroup.id > 0 ? "No stores assigned" : "Select a group first"}
              </div>
            ) : assigned.map((store) => (
              <button
                key={store.storeid}
                data-testid={`assigned-store-${store.storeid}`}
                onClick={() => handleStoreClick(store.storeid, "assigned")}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-gray-100 bg-custom-white hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <div className="text-[10px] font-medium text-content">Store {store.store_number}</div>
                  <div className="text-[9px] text-content/50">{store.store_name}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#86efac" }}>
                  Assigned
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-content/35 text-center">Click a store to move it between columns</div>
    </div>
  );

  if (bare) return body;

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ minWidth: 560 }}>
      <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex items-end gap-3" style={{ background: "#1e2a4a" }}>
        <span className="text-[13px] font-semibold text-white">Assign stores</span>
        {selectedGroup.id > 0 && (
          <span className="text-[10px] text-white/40">{selectedGroup.group_name}</span>
        )}
      </div>
      {body}
    </div>
  );
};

export default UserGroupAssign;
