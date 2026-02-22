import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { Store, JsonError, BaseGroup } from "../../../interfaces";

import {
  assignStoreToBaseGroup,
  getAllStoresInBaseGroup,
  getBGAssignedToUserSplit,
  unAssignStoreToBaseGroup,
} from "../../../api/baseGroups";
import SingleSelect from "../../../components/SingleSelect";
import Input from "../../../components/inputs/Input";

const AssignBaseGroup = () => {
  const toast = useToast();

  const { url, token } = useAppSelector((state) => state.app);
  const { companies, userid } = useAppSelector((state) => state.user);

  const [baseGroups, setBaseGroups] = useState<BaseGroup[]>([]);
  const [unassignedBGStores, setUnassignedBGStores] = useState<Store[]>([]);
  const [assignedBGStores, setAssignedBGStores] = useState<Store[]>([]);
  const [storesToAssign, setStoresToAssign] = useState<number[]>([]);
  const [storesToUnassign, setStoresToUnassign] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [showCols, setShowCols] = useState<boolean>(false);
  const [unassignedFilter, setUnassignedFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");

  const handleSelect = (id: string | number) => {
    setBaseGroups([]);
    setShowCols(false);
    setStoresToAssign([]);
    setStoresToUnassign([]);
    setSelectedGroupId(0);
    setAssignedBGStores([]);
    setUnassignedBGStores([]);
    getData(Number(id));
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
    const ids = unassignedBGStores.map((bg) => bg.storeid);
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
    const ids = assignedBGStores.map((bg) => bg.storeid);
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

  return (
    <div className="flex gap-4">
      <div className="bg-custom-white rounded-lg shadow-lg p-4 max-h-[32vh] w-[50%]">
        <SingleSelect
          label="Select Company"
          data={companies}
          displayKey={"name"}
          valueKey={"company"}
          onSelect={handleSelect}
        />
        {baseGroups.length ? (
          <div className="text-sm my-4">
            <div className="font-medium flex justify-between">
              <div>Groups</div>
            </div>
            <div className="select-none grid rounded-lg max-h-32 overflow-hidden overflow-y-auto">
              {baseGroups.map((bg) => (
                <div
                  key={bg.id}
                  className={`${selectedGroupId === bg.id && "bg-orange-200"} rounded-full py-0.5 px-2 transition-all duration-200`}
                  onClick={() => getBgStores(bg.id)}
                >
                  {bg.name}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {showCols && (
        <div className="flex gap-4 w-[49%] relative">
          <div className="bg-custom-white p-2 w-[49%] rounded-lg shadow-lg h-[70vh] absolute">
            <Input
              label={`Unassigned - ${filtered(unassignedBGStores, unassignedFilter).length}`}
              value={unassignedFilter}
              setValue={handleUnassignedFilterText}
            />
            <div className="space-y-2 my-2 rounded-lg min-h-[79%] max-h-[79%] overflow-hidden overflow-y-scroll no-scrollbar">
              {filtered(unassignedBGStores, unassignedFilter).map((store) => (
                <div
                  key={store.storeid}
                  data-testid={`unassigned-store-${store.storeid}`}
                  className={`${storesToAssign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex items-center justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
                  onClick={() => handleStoreClick(store.storeid, "unassigned")}
                >
                  <div>
                    <div className="font-medium">Store:</div>
                    <div>{store.store_name}</div>
                  </div>
                  <div>
                    <div className="font-medium text-right">Company:</div>
                    <div>{store.company_name}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-themeGreen w-full"
                onClick={handleAssignStore}
              >
                Assign
              </button>
              <button
                className="btn-themeGreen w-full"
                onClick={handleAssignAll}
              >
                Assign All
              </button>
            </div>
          </div>
          <div className="bg-custom-white p-2 w-[49%] rounded-lg shadow-lg h-[70vh] absolute translate-x-[105%]">
            <Input
              label={`Assigned - ${filtered(assignedBGStores, assignedFilter).length}`}
              value={assignedFilter}
              setValue={handleAssignedFilterText}
            />
            <div className="space-y-2 my-2 rounded-lg min-h-[79%] max-h-[79%] overflow-hidden overflow-y-scroll no-scrollbar">
              {filtered(assignedBGStores, assignedFilter).map((store) => (
                <div
                  key={store.storeid}
                  data-testid={`assigned-store-${store.storeid}`}
                  className={`${storesToUnassign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex items-center justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
                  onClick={() => handleStoreClick(store.storeid, "assigned")}
                >
                  <div>
                    <div className="font-medium">Store:</div>
                    <div>{store.store_name}</div>
                  </div>
                  <div>
                    <div className="font-medium text-right">Company:</div>
                    <div>{store.company_name}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-themeGreen w-full"
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
      )}
    </div>
  );
};

export default AssignBaseGroup;
