import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  updateStoresWithStatus,
  type StoreWithGroupStatus,
} from "../../features/groupSlice";
import { useGridCols } from "./hooks";
import { addStoreToGroup, removeStoreFromGroup } from "../../api/groups";
import { handleRipple } from "../../utils";

const GroupList = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const group = useAppSelector((state) => state.group);
  const [searchText, setSearchText] = useState<string>("");
  const [filteredStores, setFilteredStores] = useState<StoreWithGroupStatus[]>(
    []
  );
  const cols = useGridCols();

  useEffect(() => {
    const result = group.storesWithGroupStatus.filter((store) => {
      switch (group.filterOption) {
        case "active":
          return store.active === 1;
        case "inactive":
          return store.active === 0;
        case "all":
        default:
          return true;
      }
    });

    if (searchText.trim() === "") {
      setFilteredStores(result);
    } else {
      const filtered = result.filter((store) =>
        store.store_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchText, group.storesWithGroupStatus, group.filterOption]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, store: StoreWithGroupStatus) => {
    if (!group.selectedGroup) return;
    handleRipple(e);

    if (store.active === 1) {
      removeStoreFromGroup(
        context.url,
        context.token,
        user.userid,
        group.selectedGroup.id,
        store.storeid
      ).then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(updateStoresWithStatus(store.storeid));
        }
      });
    } else {
      addStoreToGroup(
        context.url,
        context.token,
        user.userid,
        group.selectedGroup.id,
        store.storeid
      ).then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(updateStoresWithStatus(store.storeid));
        }
      });
    }
  };

  return (
    <div className="h-full" data-testid="group-list">
      <div className="w-full flex items-end gap-4 mb-4">
        <div className="w-full">
          <div className="text-sm font-semibold text-themeText">
            Search for stores
          </div>
          <input
            type="text"
            value={searchText}
            placeholder="Search stores..."
            className="basic-input bg-custom-white"
            onChange={(e) => setSearchText(e.currentTarget.value)}
          />
        </div>
      </div>
      <div
        className={`grid ${cols} text-sm gap-x-4 gap-y-2 max-h-[51vh] md:max-h-[80vh] overflow-y-scroll no-scrollbar rounded-lg pb-4 select-none`}
      >
        {filteredStores.map((store) => (
          <div
            key={store.storeid}
            className="flex justify-between items-center bg-custom-white rounded-lg 
              shadow-md py-4 px-3 hover:shadow-inner transition-all duration-200 cursor-pointer ripple-button"
            onClick={(e) => handleCardClick(e, store)}
          >
            <div className="font-medium space-y-0.5">
              <div>Store {store.store_number}</div>
              <div>
                {store.storeid} - {store.store_name}
              </div>
            </div>
            <div
              className={`status ${
                store.active ? "text-emerald-500" : "text-orange-500"
              } font-medium`}
            >
              {store.active ? "Active" : "Inactive"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
