import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { Store, JsonError } from "../../../interfaces";

import {
  assignStoreToBaseGroup,
  getAllStoresInBaseGroup,
  unAssignStoreToBaseGroup,
} from "../../../api/baseGroups";
import Input from "../../../components/inputs/Input";
import { setBGStores } from "../../../features/baseGroupSlice";

const AssignStoresBG = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { url, token } = useAppSelector((state) => state.app);
  const { assignedStoresInBG, unassignedStoresInBG, selectedBG } =
    useAppSelector((state) => state.baseGroup);
  const [storesToAssign, setStoresToAssign] = useState<number[]>([]);
  const [storesToUnassign, setStoresToUnassign] = useState<number[]>([]);
  const [unassignedFilter, setUnassignedFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");

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
    assignStoreToBaseGroup(url, token, storesToAssign, selectedBG)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedBG);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassignStore = () => {
    unAssignStoreToBaseGroup(url, token, storesToUnassign, selectedBG)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedBG);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleAssignAll = () => {
    const ids = filtered(unassignedStoresInBG, unassignedFilter).map(
      (s) => s.storeid,
    );
    assignStoreToBaseGroup(url, token, ids, selectedBG)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedBG);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassignAll = () => {
    const ids = filtered(assignedStoresInBG, assignedFilter).map(
      (s) => s.storeid,
    );
    unAssignStoreToBaseGroup(url, token, ids, selectedBG)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedBG);
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

  const getBgStores = (groupid: number) => {
    getAllStoresInBaseGroup(url, token, groupid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setBGStores({ assigned: j.assigned_stores, unassigned: j.unassigned_stores }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="flex gap-2 relative">
      <div className="">
        <div className="bg-custom-white p-2 rounded-t-lg">
          <Input
            label={`Unassigned - ${filtered(unassignedStoresInBG, unassignedFilter).length}`}
            value={unassignedFilter}
            setValue={handleUnassignedFilterText}
          />
        </div>
        <div className="bg-custom-white p-2 space-y-2 py-2 max-h-[calc(100vh-13rem)] overflow-hidden overflow-y-scroll no-scrollbar">
          {filtered(unassignedStoresInBG, unassignedFilter).map((store) => (
            <div
              key={store.storeid}
              data-testid={`unassigned-store-${store.storeid}`}
              className={`${storesToAssign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex justify-between rounded-lg shadow px-3 py-1.5 text-[12px] cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
              onClick={() => handleStoreClick(store.storeid, "unassigned")}
            >
              <div>
                <div className="font-medium text-content/60">Store:</div>
                <div>{store.store_name}</div>
              </div>
              <div>
                <div className="underline text-[10px] font-medium text-content/60">
                  {store.company_name}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12.5px] bg-custom-white p-2 rounded-b-lg">
          <button
            className="btn-themeGreen w-full px-0"
            onClick={handleAssignStore}
          >
            Assign
          </button>
          <button
            className="btn-themeGreen w-full px-0"
            onClick={handleAssignAll}
          >
            Assign All
          </button>
        </div>
      </div>
      <div className="">
        <div className="bg-custom-white p-2 rounded-t-lg shadow-lg">
          <Input
            label={`Assigned - ${filtered(assignedStoresInBG, assignedFilter).length}`}
            value={assignedFilter}
            setValue={handleAssignedFilterText}
          />
        </div>
        <div className="space-y-2 py-2 bg-custom-white max-h-[calc(100vh-13rem)] overflow-hidden overflow-y-scroll no-scrollbar">
          {filtered(assignedStoresInBG, assignedFilter).map((store) => (
            <div
              key={store.storeid}
              data-testid={`assigned-store-${store.storeid}`}
              className={`${storesToUnassign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex justify-between rounded-lg shadow px-3 py-1.5 text-[12px] cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
              onClick={() => handleStoreClick(store.storeid, "assigned")}
            >
              <div>
                <div className="font-medium text-content/60">Store:</div>
                <div>{store.store_name}</div>
              </div>
              <div>
                <div className="underline text-[10px] font-medium text-content/60">
                  {store.company_name}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12.5px] bg-custom-white p-2 rounded-b-lg">
          <button
            className="btn-themeGreen w-full px-0"
            onClick={handleUnassignStore}
          >
            Unassign
          </button>
          <button
            className="btn-themeGreen w-full px-0"
            onClick={handleUnassignAll}
          >
            Unassign All
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStoresBG;
