import { useEffect, useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setSelectedNewUserStores,
  type StoreWithBGID,
} from "../../../features/baseGroupSlice";

const StoresWithBG = () => {
  const dispatch = useAppDispatch();
  const [selectedBG, setSelectedBG] = useState<number>(0);
  // const [filtered, setFiltered] = useState<StoreWithBGID[]>([]);
  const { companies } = useAppSelector((state) => state.user);
  const [showSelected, setShowSelected] = useState<boolean>(false);
  const { storesWithBGID, selectedBaseGroups, selectedNewUserStores } =
    useAppSelector((state) => state.baseGroup);

  // Everytime storesWithBGID has the current selected base group filteredout
  // reset it to 0 (The "All" option)
  useEffect(() => {
    if (!storesWithBGID.some((s) => s.base_group === selectedBG)) {
      setSelectedBG(0);
      setShowSelected(false);
    }
  }, [storesWithBGID]);

  console.log(showSelected)

  // useEffect(() => {
  //   if (!storesWithBGID.length || !selectedBaseGroups.length) {
  //     setSelectedBG(0);
  //     setFiltered([]);
  //     return;
  //   }

  //   if (
  //     selectedBG === 0 ||
  //     !storesWithBGID.some((b) => b.base_group === selectedBG)
  //   ) {
  //     // If no base group is selected, then filter by Selection or just return all...
  //     const renderSelected = storesWithBGID.filter((s) => {
  //       if (showSelected) {
  //         return selectedNewUserStores.some(
  //           (store) => store.storeid === s.storeid,
  //         );
  //       } else {
  //         return true;
  //       }
  //     });
  //     setFiltered(renderSelected);
  //   } else {
  //     const filteredStores = storesWithBGID.filter((s) => {
  //       const isShowingSelected = showSelected
  //         ? selectedNewUserStores.some((store) => store.storeid === s.storeid)
  //         : true;

  //       return isShowingSelected && s.base_group === selectedBG;
  //     });
  //     setFiltered(filteredStores);
  //   }
  // }, [selectedBG, showSelected]);

  const filtered = useMemo(() => {
    if (!storesWithBGID.length) return [];

    const baseFiltered =
      selectedBG === 0
        ? storesWithBGID
        : storesWithBGID.filter((s) => s.base_group === selectedBG);

    return showSelected
      ? baseFiltered.filter((s) =>
          selectedNewUserStores.some((store) => store.storeid === s.storeid && store.base_group === s.base_group),
        )
      : baseFiltered;
  }, [
    storesWithBGID,
    selectedBG,
    showSelected,
    selectedNewUserStores,
  ]);

  if (!selectedBaseGroups.length || !storesWithBGID.length) return null;

  const handleBGSelect = (bgId: number) => {
    setSelectedBG((prev) => (prev === bgId ? 0 : bgId));
  };

  const handleStoreSelect = (store: StoreWithBGID) => {
    const found = selectedNewUserStores.find(
      (s) => s.storeid === store.storeid,
    );
    if (found) {
      const filteredSelected = selectedNewUserStores.filter(
        (s) => s.storeid !== store.storeid,
      );
      dispatch(setSelectedNewUserStores(filteredSelected));
    } else {
      dispatch(setSelectedNewUserStores([...selectedNewUserStores, store]));
    }
  };

  const handleSelectAll = (action: "add" | "remove") => {
    if (action === "add") {
      dispatch(setSelectedNewUserStores(filtered));
    } else {
      const filteredOut = selectedNewUserStores.filter(
        (s) => !filtered.some((f) => f.storeid === s.storeid),
      );
      dispatch(setSelectedNewUserStores(filteredOut));
    }
  };

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
        <div
          className={`text-[11px] rounded-full px-2 py-0.5 border border-content/15 cursor-pointer transition-all duration-200
                hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white shadow ${
                  showSelected
                    ? "bg-[rgb(30,45,80)] text-custom-white"
                    : "bg-content/10"
                }`}
          onClick={() => setShowSelected((prev) => !prev)}
        >
          <div>Selected</div>
        </div>
      </div>

      <div className="max-h-[calc(100vh-13rem)] pb-2 overflow-y-auto grid grid-cols-2 gap-2 text-[11.5px]">
        <div className="min-h-[51px] transition-all duration-200 cursor-pointer bg-content/10 rounded-xl px-2 py-2 shadow-md leading-tight grid grid-cols-2 gap-2 items-center">
          <button
            className="bg-[rgb(30,45,80)] text-custom-white transition-all duration-200 rounded-lg py-2 font-medium border-2 border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:shadow-md"
            onClick={() => handleSelectAll("add")}
          >
            Add All
          </button>
          <button
            className="bg-red-600 text-custom-white transition-all duration-200 rounded-lg py-2 font-medium border-2 border-red-600 hover:bg-red-600/75 hover:shadow-md"
            onClick={() => handleSelectAll("remove")}
          >
            Remove All
          </button>
        </div>
        {filtered.map((s, i) => {
          const found = selectedBaseGroups.filter(
            (b) => b.id === s.base_group,
          )[0];

          if (!found) return null;

          return (
            <div
              key={i}
              className={`transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white cursor-pointer 
                ${selectedNewUserStores.some((store) => store.storeid === s.storeid && store.base_group === s.base_group) ? "bg-[rgb(30,45,80)] text-custom-white" : "bg-content/10"} 
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

export default StoresWithBG;
