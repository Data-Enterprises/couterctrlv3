import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type {
  Store,
  JsonError,
  BaseGroup,
  UserCompany,
} from "../../../interfaces";

import {
  assignStoreToBaseGroup,
  getAllStoresInBaseGroup,
  getBGAssignedToUserSplit,
  unAssignStoreToBaseGroup,
} from "../../../api/baseGroups";
import Input from "../../../components/inputs/Input";
import { setUserCompany } from "../../../features/baseGroupSlice";

const AssignBaseGroup = () => {
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

  return (
    <div className="grid grid-cols-3 gap-2 w-[70%]">
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
            <div className="text-[13px] my-4">
              <div className="font-medium pl-0.5">
                <div>Groups</div>
              </div>
              <div className="select-none rounded-lg max-h-[54vh] overflow-hidden overflow-y-auto">
                {baseGroups.map((bg) => (
                  <div
                    key={bg.id}
                    className={`${selectedGroupId === bg.id && "bg-orange-200"} hover:bg-blue-200 rounded-full border-b py-1 px-2 transition-all duration-200`}
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
        <>
          <div className="bg-custom-white p-2 rounded-lg shadow-lg h-[70vh]">
            <Input
              label={`Unassigned - ${filtered(unassignedBGStores, unassignedFilter).length}`}
              value={unassignedFilter}
              setValue={handleUnassignedFilterText}
            />
            <div className="space-y-2 my-2 rounded-lg min-h-[81.5%] max-h-[81.5%] overflow-hidden overflow-y-scroll no-scrollbar">
              {filtered(unassignedBGStores, unassignedFilter).map((store) => (
                <div
                  key={store.storeid}
                  data-testid={`unassigned-store-${store.storeid}`}
                  className={`${storesToAssign.includes(store.storeid) ? "bg-[rgb(30,45,80)] text-custom-white" : ""} hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white text-[13px] px-2 py-1 rounded-lg shadow-md flex justify-between cursor-pointer transition-all duration-200`}
                  onClick={() => handleStoreClick(store.storeid, "unassigned")}
                >
                  <div>
                    <div className="font-medium opacity-90">Store:</div>
                    <div>{store.store_name}</div>
                  </div>
                  <div>
                    <div className="underline text-[10px] font-medium opacity-90">
                      {store.company_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`${storesToAssign.length === 0 && "opacity-50 pointer-events-none"} btn-themeGreen bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1 text-[13px]`}
                onClick={handleAssignStore}
              >
                Assign
              </button>
              <button
                className="btn-themeGreen bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1 text-[13px]"
                onClick={handleAssignAll}
              >
                Assign All
              </button>
            </div>
          </div>
          <div className="bg-custom-white p-2 rounded-lg shadow-lg h-[70vh]">
            <Input
              label={`Assigned - ${filtered(assignedBGStores, assignedFilter).length}`}
              value={assignedFilter}
              setValue={handleAssignedFilterText}
            />
            <div className="space-y-2 my-2 rounded-lg min-h-[81.5%] max-h-[81.5%] overflow-hidden overflow-y-scroll no-scrollbar">
              {filtered(assignedBGStores, assignedFilter).map((store) => (
                <div
                  key={store.storeid}
                  data-testid={`assigned-store-${store.storeid}`}
                  className={`${storesToUnassign.includes(store.storeid) ? "bg-[rgb(30,45,80)] text-custom-white" : ""} hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white text-[13px] px-2 py-1 rounded-lg shadow-md flex justify-between cursor-pointer transition-all duration-200`}
                  onClick={() => handleStoreClick(store.storeid, "assigned")}
                >
                  <div>
                    <div className="font-medium opacity-90">Store:</div>
                    <div>{store.store_name}</div>
                  </div>
                  <div>
                    <div className="underline text-[10px] font-medium opacity-90">
                      {store.company_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`${storesToUnassign.length === 0 && "opacity-50 pointer-events-none"} btn-themeGreen bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1 text-[13px]`}
                onClick={handleUnassignStore}
              >
                Unassign
              </button>
              <button
                className="btn-themeGreen bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1 text-[13px]"
                onClick={handleUnassignAll}
              >
                Unassign All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignBaseGroup;
