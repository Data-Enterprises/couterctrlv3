import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setSelectedNewUserStores,
  type StoreWithBGID,
} from "../../../features/baseGroupSlice";

const StoresWithBG = () => {
  const dispatch = useAppDispatch();
  const [selectedBG, setSelectedBG] = useState<number>(0);
  const [filtered, setFiltered] = useState<StoreWithBGID[]>([]);
  const { companies } = useAppSelector((state) => state.user);
  // const [selectedStores, setSelectedStores] = useState<StoreWithBGID[]>([]);
  const { storesWithBGID, selectedBaseGroups, selectedNewUserStores } =
    useAppSelector((state) => state.baseGroup);

  useEffect(() => {
    if (!storesWithBGID.length || !selectedBaseGroups.length) {
      setSelectedBG(0);
      setFiltered([]);
      return;
    }

    console.log("stores with bg id", storesWithBGID);
    console.log("selected base groups", selectedBaseGroups);
    console.log("selected bg", selectedBG);

    // return;

    if (
      selectedBG === 0 ||
      !storesWithBGID.some((b) => b.base_group === selectedBG)
    ) {
      setFiltered(storesWithBGID);
    } else {
      const filteredStores = storesWithBGID.filter(
        (s) => s.base_group === selectedBG,
      );
      setFiltered(filteredStores);
    }
  }, [selectedBG, selectedBaseGroups, storesWithBGID]);

  if (!filtered.length || !selectedBaseGroups.length || !storesWithBGID.length)
    return null;

  const handleBGSelect = (bgId: number) => {
    setSelectedBG((prev) => (prev === bgId ? 0 : bgId));
  };

  const handleStoreSelect = (store: StoreWithBGID) => {
    const found = selectedNewUserStores.find((s) => s.storeid === store.storeid);
    if (found) {
      const filteredSelected = selectedNewUserStores.filter(
        (s) => s.storeid !== store.storeid,
      );
      dispatch(setSelectedNewUserStores(filteredSelected));
    } else {
      dispatch(setSelectedNewUserStores([...selectedNewUserStores, store]));
    }
  };

  // const textColor = (id: number) => {
  //   if (selectedNewUserStores.some((s) => s.storeid === id)) {
  //     return "text-custom-white";
  //   }
  //   return "text-content";
  // };

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg space-y-2 select-none">
      <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto leading-tight">
        {selectedBaseGroups.map((bg, i) => {
          const companyName =
            companies.find((c) => c.company === bg.company)?.name ||
            "Unknown Company";
          return (
            <div
              key={i}
              className={`text-[11px] rounded-full px-2 py-0.5 border border-content/15 cursor-pointer transition-all duration-200
                hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white shadow ${
                  selectedBG === bg.id
                    ? "bg-[rgb(30,45,80)] text-custom-white"
                    : "bg-content/10"
                }`}
              onClick={() => handleBGSelect(bg.id)}
            >
              <div>
                {bg.name} - {companyName}
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-h-[calc(100vh-13rem)] pb-2 overflow-y-auto grid grid-cols-2 gap-2 text-[11.5px]">
        {filtered.map((s, i) => {
          const found =
            selectedBaseGroups.filter((b) => b.id === s.base_group)[0];

          if (!found) return null;

          return (
            <div
              key={i}
              className={`transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white cursor-pointer 
                ${selectedNewUserStores.some((store) => store.storeid === s.storeid) ? "bg-[rgb(30,45,80)] text-custom-white" : "bg-content/10"} 
                rounded-xl px-2 py-1 shadow-md leading-tight`}
              onClick={() => handleStoreSelect(s)}
            >
              <div className="flex justify-between">
                <div className="opacity-90">Store</div>
                <div className={`font-medium`}>{s.store_name}</div>
              </div>
              <div className="flex justify-between">
                <div className="opacity-90">Base Group:</div>
                <div className={`font-medium`}>{found.name}</div>
              </div>
              <div className="flex justify-between">
                <div className="opacity-90">Company:</div>
                <div className={`font-medium`}>
                  {companies.find((c) => c.company === s.company)?.name ||
                    "Unknown Company"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// const StoreList = (stores: StoreWithBGID[]) => {};

export default StoresWithBG;
