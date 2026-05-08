import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type {
  Store,
  JsonError,
  BaseGroup,
  UserCompany,
} from "../../../../interfaces";

import {
  assignStoreToBaseGroup,
  getAllStoresInBaseGroup,
  getBGAssignedToUserSplit,
  unAssignStoreToBaseGroup,
} from "../../../../api/baseGroups";
import Input from "../../../../components/inputs/Input";
import { setUserCompany } from "../../../../features/baseGroupSlice";

const StoresBGAssignForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { url, token } = useAppSelector((state) => state.app);
  const { companies, userid } = useAppSelector((state) => state.user);
  const { userCompany } = useAppSelector((state) => state.baseGroup);

  const [baseGroups, setBaseGroups] = useState<BaseGroup[]>([]);
  const [unassignedBGStores, setUnassignedBGStores] = useState<Store[]>([]);
  const [assignedBGStores, setAssignedBGStores] = useState<Store[]>([]);
  const [storesToAssign, setStoresToAssign] = useState<number[]>([]);
  const [storesToUnassign, setStoresToUnassign] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [showCols, setShowCols] = useState<boolean>(false);
  const [unassignedFilter, setUnassignedFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");

  const handleCompanySelect = (c: UserCompany) => {
    setBaseGroups([]);
    setShowCols(false);
    setStoresToAssign([]);
    setStoresToUnassign([]);
    setSelectedGroupId(0);
    setAssignedBGStores([]);
    setUnassignedBGStores([]);
    dispatch(setUserCompany(c));
    getData(c.company);
  };

  const getData = (company: number) => {
    getBGAssignedToUserSplit(url, token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setBaseGroups(
            j.active.filter((bg: BaseGroup) => bg.company === company),
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const getBgStores = (groupid: number) => {
    setStoresToAssign([]);
    setStoresToUnassign([]);
    setSelectedGroupId(groupid);
    getAllStoresInBaseGroup(url, token, groupid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setAssignedBGStores(j.assigned_stores);
          setUnassignedBGStores(j.unassigned_stores);
          setShowCols(true);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleStoreClick = (
    storeid: number,
    column: "assigned" | "unassigned",
  ) => {
    if (column === "assigned") {
      setStoresToUnassign((prev) => {
        if (prev.includes(storeid)) {
          return prev.filter((id) => id !== storeid);
        } else {
          return [...prev, storeid];
        }
      });
    } else {
      setStoresToAssign((prev) => {
        if (prev.includes(storeid)) {
          return prev.filter((id) => id !== storeid);
        } else {
          return [...prev, storeid];
        }
      });
    }
  };

  const handleAssignStore = () => {
    assignStoreToBaseGroup(url, token, storesToAssign, selectedGroupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedGroupId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassignStore = () => {
    unAssignStoreToBaseGroup(url, token, storesToUnassign, selectedGroupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedGroupId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleAssignAll = () => {
    const ids = filtered(unassignedBGStores, unassignedFilter).map(
      (s) => s.storeid,
    );
    assignStoreToBaseGroup(url, token, ids, selectedGroupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedGroupId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassignAll = () => {
    const ids = filtered(assignedBGStores, assignedFilter).map(
      (s) => s.storeid,
    );
    unAssignStoreToBaseGroup(url, token, ids, selectedGroupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedGroupId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const filtered = (data: Store[], filter: string) => {
    return data.filter((x) =>
      x.store_name.toLowerCase().includes(filter.toLowerCase()),
    );
  };

  const handleAssignedFilterText = (x: string) => {
    setAssignedFilter(x);
  };

  const handleUnassignedFilterText = (x: string) => {
    setUnassignedFilter(x);
  };

  const companyBG = (id: number) => {
    if (userCompany && userCompany.company === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  const listItemBase =
    "w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 shadow-sm flex items-start justify-between gap-3";

  return (
    <div className="grid gap-2">
      <div>
        <div className="bg-custom-white rounded-lg shadow-lg p-2">
          <div className="text-[13px] font-medium pl-0.5">Companies</div>
          <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1">
            {companies.map((c) => (
              <div
                key={c.id}
                className={`px-2 py-0.5 rounded-full ${companyBG(c.company)} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
                onClick={() => handleCompanySelect(c)}
              >
                {c.name}
              </div>
            ))}
          </div>
          {baseGroups.length ? (
            <div className="text-[13px] my-3">
              <div className="font-medium pl-0.5">
                <div>Groups</div>
              </div>
              <div className="select-none rounded-lg max-h-[54vh] grid grid-cols-2 overflow-hidden overflow-y-auto">
                {baseGroups.map((bg) => (
                  <div
                    key={bg.id}
                    className={`${selectedGroupId === bg.id && "bg-[rgb(30,45,80)]/75 text-custom-white"} rounded-full border-b py-1 px-2 transition-all duration-200`}
                    onClick={() => getBgStores(bg.id)}
                  >
                    {bg.name}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {showCols && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[13px] font-semibold text-slate-800">
                Unassigned
              </div>
              <div className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                {filtered(unassignedBGStores, unassignedFilter).length}
              </div>
            </div>

            <Input
              label="Search stores"
              value={unassignedFilter}
              setValue={handleUnassignedFilterText}
            />

            <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1 no-scrollbar">
              {filtered(unassignedBGStores, unassignedFilter).map((store) => (
                <button
                  key={store.storeid}
                  data-testid={`unassigned-store-${store.storeid}`}
                  onClick={() => handleStoreClick(store.storeid, "unassigned")}
                  className={`${listItemBase} ${
                    storesToAssign.includes(store.storeid)
                      ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                      : "bg-custom-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Store
                    </div>
                    <div className="truncate text-[13px] font-semibold text-slate-900">
                      {store.store_name}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    {store.company_name}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className={`${storesToAssign.length === 0 && "pointer-events-none opacity-50"} rounded-xl bg-[rgb(30,45,80)] py-2 text-[13px] font-medium text-custom-white shadow-sm transition-all duration-200 hover:bg-[rgb(30,45,80)]/85`}
                onClick={handleAssignStore}
              >
                Assign
              </button>
              <button
                className="rounded-xl border border-[rgb(30,45,80)] bg-[rgb(30,45,80)] text-custom-white py-2 text-[13px] font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                onClick={handleAssignAll}
              >
                Assign All
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[13px] font-semibold text-slate-800">
                Assigned
              </div>
              <div className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                {filtered(assignedBGStores, assignedFilter).length}
              </div>
            </div>

            <Input
              label="Search stores"
              value={assignedFilter}
              setValue={handleAssignedFilterText}
            />

            <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1 no-scrollbar">
              {filtered(assignedBGStores, assignedFilter).map((store) => (
                <button
                  key={store.storeid}
                  data-testid={`assigned-store-${store.storeid}`}
                  onClick={() => handleStoreClick(store.storeid, "assigned")}
                  className={`${listItemBase} ${
                    storesToUnassign.includes(store.storeid)
                      ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                      : "bg-custom-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Store
                    </div>
                    <div className="truncate text-[13px] font-semibold text-slate-900">
                      {store.store_name}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    {store.company_name}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className={`${storesToUnassign.length === 0 && "pointer-events-none opacity-50"} rounded-xl bg-[rgb(30,45,80)] py-2 text-[13px] font-medium text-custom-white shadow-sm transition-all duration-200 hover:bg-[rgb(30,45,80)]/85`}
                onClick={handleUnassignStore}
              >
                Unassign
              </button>
              <button
                className="rounded-xl border border-[rgb(30,45,80)] bg-[rgb(30,45,80)] text-custom-white py-2 text-[13px] font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                onClick={handleUnassignAll}
              >
                Unassign All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresBGAssignForm;
