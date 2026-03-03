import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type { Store } from "../../../interfaces";

const StoreInfo = () => {
  const [filterText, setFilterText] = useState<string>("");
  const [filterType, setFilterType] = useState<"store_number" | "store_name">(
    "store_name",
  );
  const { assignedStores, unassignedStores } = useAppSelector(
    (state) => state.user,
  );
  const [filtered, setFiltered] = useState<Store[]>([
    ...assignedStores,
    ...unassignedStores,
  ]);

  useEffect(() => {
    if (filterText.length) {
      const filteredStores = [...assignedStores, ...unassignedStores].filter(
        (s) => {
          if (filterType === "store_name") {
            return s.store_name.toLowerCase().includes(filterText.toLowerCase())
          } else {
            return s.store_number == filterText;
          }
        },
      );
      setFiltered(filteredStores);
    } else {
      setFiltered([...assignedStores, ...unassignedStores]);
    }
  }, [filtered]);

  return (
    <div className="w-[50%]">
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-y-1">
          <button
            className={`py-1.5 ${filterType === "store_name" ? "bg-orange-200" : "bg-custom-white"} rounded-l-lg transition-all duration-200 font-medium`}
            onClick={() => setFilterType("store_name")}
          >
            Store Name
          </button>
          <button
            className={`py-1.5 ${filterType === "store_number" ? "bg-orange-200" : "bg-custom-white"} rounded-r-lg transition-all duration-200 font-medium`}
            onClick={() => setFilterType("store_number")}
          >
            Store Number
          </button>
          <input
            type="text"
            className="basic-input focus:border col-span-2 bg-custom-white"
            value={filterText}
            onChange={(e) => setFilterText(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-[0.8fr_0.9fr_1.5fr_0.8fr_1fr] bg-[rgb(30,45,80)] rounded-t-lg text-custom-white py-1 text-sm font-medium">
        <div className="px-2 border-r">Store ID</div>
        <div className="px-2 border-r">Store Number</div>
        <div className="px-2 border-r">Store Name</div>
        <div className="px-2 border-r">Company ID</div>
        <div className="px-2">Company Name</div>
      </div>
      <div className="max-h-[59vh] overflow-hidden overflow-y-scroll no-scrollbar bg-custom-white rounded-lg shadow-lg">
        {filtered.map((s) => (
          <div className="grid grid-cols-[0.8fr_0.9fr_1.5fr_0.8fr_1fr] py-1 text-sm even:bg-[#afb0b3]">
            <div className="px-2">{s.storeid}</div>
            <div className="px-2">{s.store_number}</div>
            <div className="px-2">{s.store_name}</div>
            <div className="px-2">{s.company}</div>
            <div className="px-2">{s.company_name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreInfo;
