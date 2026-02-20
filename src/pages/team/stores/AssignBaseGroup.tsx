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
  const [storeToAssign, setStoreToAssign] = useState<number>(0);
  const [storeToUnassign, setStoreToUnassign] = useState<number>(0);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [showCols, setShowCols] = useState<boolean>(false);

  const handleSelect = (id: string | number) => {
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
    setStoreToAssign(0);
    setStoreToUnassign(0);
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
      setStoreToUnassign((prev) => (prev === storeid ? 0 : storeid));
    } else {
      setStoreToAssign((prev) => (prev === storeid ? 0 : storeid));
    }
  };

  const handleAssignStore = () => {
    assignStoreToBaseGroup(url, token, storeToAssign, selectedGroupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedGroupId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassignStore = () => {
    unAssignStoreToBaseGroup(url, token, storeToUnassign, selectedGroupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getBgStores(selectedGroupId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-custom-white rounded-lg shadow-lg p-4 max-h-[29vh]">
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
            <div className="select-none grid grid-cols-2 bg-bkg/80 rounded-lg p-1 min-h-28 max-h-28 overflow-hidden overflow-y-scroll no-scrollbar">
              {baseGroups.map((bg) => (
                <div
                  key={bg.id}
                  className={`${selectedGroupId === bg.id && "bg-orange-200"} py-0.5 px-2 transition-all duration-200`}
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
        <div className="flex gap-4">
          <div className="bg-custom-white p-2 w-1/2 rounded-lg shadow-lg h-[70vh]">
            <div className="text-sm font-medium">
              Unassigned - {unassignedBGStores.length}
            </div>
            <Input label="" value="" setValue={() => {}} />
            <div className="space-y-2 my-2 rounded-lg min-h-[79%] max-h-[79%] overflow-hidden overflow-y-scroll no-scrollbar">
              {unassignedBGStores.map((store) => (
                <div
                  key={store.storeid}
                  data-testid={`unassigned-store-${store.storeid}`}
                  className={`${storeToAssign === store.storeid ? "bg-emerald-200" : "bg-custom-white"} flex items-center justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
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
            <button
              className="btn-themeBlue w-full"
              onClick={handleAssignStore}
            >
              Assign
            </button>
          </div>
          <div className="bg-custom-white p-2 w-1/2 rounded-lg shadow-lg h-[70vh]">
            <div className="text-sm font-medium">
              Assigned - {assignedBGStores.length}
            </div>
            <Input label="" value="" setValue={() => {}} />
            <div className="space-y-2 my-2 rounded-lg min-h-[79%] max-h-[79%] overflow-hidden overflow-y-scroll no-scrollbar">
              {assignedBGStores.map((store) => (
                <div
                  key={store.storeid}
                  data-testid={`assigned-store-${store.storeid}`}
                  className={`${storeToUnassign === store.storeid ? "bg-emerald-200" : "bg-custom-white"} flex items-center justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
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
            <button
              className="btn-themeBlue w-full"
              onClick={handleUnassignStore}
            >
              Unassign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignBaseGroup;
