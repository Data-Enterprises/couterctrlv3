import { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import type { StoreWithGroupStatus } from "../../features/groupSlice";
import { useGridCols } from "./hooks";

const GroupList = () => {
  const group = useAppSelector((state) => state.group);
  const [searchText, setSearchText] = useState<string>("");
  const [filteredStores, setFilteredStores] = useState<StoreWithGroupStatus[]>(
    []
  );
  const cols = useGridCols();

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredStores(group.storesWithGroupStatus);
    } else {
      const filtered = group.storesWithGroupStatus.filter((store) =>
        store.store_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchText, group.storesWithGroupStatus]);

  const handleCardClick = (store: StoreWithGroupStatus) => {
    console.log(store);
  };

  return (
    <div className="ml-10 h-full" data-testid="group-list">
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
        className={`grid ${cols} gap-x-4 gap-y-2 max-h-[80vh] overflow-y-scroll no-scrollbar rounded-lg shadow-lg select-none`}
      >
        {filteredStores.map((store) => (
          <div
            key={store.storeid}
            className="flex justify-between items-center bg-custom-white rounded-lg 
              shadow-md p-4 hover:bg-blue-200/50 transition-all duration-200 cursor-pointer"
          >
            <div>
              <div>Store {store.store_number}</div>
              <div>
                {store.storeid} - {store.store_name}
              </div>
            </div>
            <div>
              {store.active === 1 ? (
                <span className="text-emerald-500 font-semibold">Active</span>
              ) : (
                <span className="text-orange-500 font-semibold">Inactive</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
