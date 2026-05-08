import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import type { Store } from "../../../../interfaces";

const StoresInfoTablet = () => {
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
            return s.store_name
              .toLowerCase()
              .includes(filterText.toLowerCase());
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
    <div className="">
      <div className="mb-2">
        <div className="flex gap-2 gap-y-1">
          <input
            type="text"
            data-testid="store-info-filter-input"
            className="basic-input focus:border col-span-2 bg-custom-white py-1.5"
            value={filterText}
            onChange={(e) => setFilterText(e.currentTarget.value)}
          />
          <button
            className={`w-1/4 py-1.5 text-[13px] px-2 ${filterType === "store_name" ? "bg-orange-200" : "bg-custom-white"} rounded-full transition-all duration-200 font-medium`}
            onClick={() => setFilterType("store_name")}
          >
            Store Name
          </button>
          <button
            className={`w-1/4 py-1.5 text-[13px] px-2 ${filterType === "store_number" ? "bg-orange-200" : "bg-custom-white"} rounded-full transition-all duration-200 font-medium`}
            onClick={() => setFilterType("store_number")}
          >
            Store Number
          </button>
        </div>
      </div>
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((s, i) => (
            <div
              key={i}
              className="rounded-xl bg-custom-white p-3 shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-content/60">
                    Store Name
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {s.store_name}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-content/60">
                    Store ID
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {s.storeid}
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-[rgb(30,45,80)]/85 border border-[rgb(30,45,80)] px-2.5 py-1 text-[12px] font-semibold text-custom-white">
                  #{s.store_number}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-200/70 pt-3 text-[12px]">
                <div className="rounded-xl bg-bkg p-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content/60">
                    Company Name
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {s.company_name}
                  </div>
                </div>

                <div className="rounded-xl bg-bkg p-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content/60">
                    Company ID
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {s.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoresInfoTablet;
