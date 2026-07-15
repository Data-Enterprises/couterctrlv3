import { useMemo, useState } from "react";
import { useTeamCtx } from "../../hooks";
import { setSelectedNewUserStores } from "../../../../../features/baseGroupSlice";
import type { StoreWithBGID } from "../../../../../features/baseGroupSlice";

interface StepStoresProps {
  onContinue: () => void;
}

const StepStores = ({ onContinue }: StepStoresProps) => {
  const ctx = useTeamCtx();
  const [selectedBG, setSelectedBG] = useState<number>(0);
  const [showSelected, setShowSelected] = useState(false);

  const filtered = useMemo(() => {
    if (!ctx.storesWithBGID.length) return [];
    const baseFiltered =
      selectedBG === 0
        ? ctx.storesWithBGID
        : ctx.storesWithBGID.filter((s) => s.base_group === selectedBG);
    return showSelected
      ? baseFiltered.filter((s) =>
          ctx.selectedNewUserStores.some(
            (store) =>
              store.storeid === s.storeid && store.base_group === s.base_group,
          ),
        )
      : baseFiltered;
  }, [ctx.storesWithBGID, selectedBG, showSelected, ctx.selectedNewUserStores]);

  const handleBGFilterSelect = (bgId: number) => {
    setSelectedBG((prev) => (prev === bgId ? 0 : bgId));
  };

  const handleStoreSelect = (store: StoreWithBGID) => {
    const found = ctx.selectedNewUserStores.find(
      (s) => s.storeid === store.storeid && s.base_group === store.base_group,
    );
    if (found) {
      ctx.dispatch(
        setSelectedNewUserStores(
          ctx.selectedNewUserStores.filter(
            (s) =>
              !(
                s.storeid === store.storeid && s.base_group === store.base_group
              ),
          ),
        ),
      );
    } else {
      ctx.dispatch(
        setSelectedNewUserStores([...ctx.selectedNewUserStores, store]),
      );
    }
  };

  const handleSelectAll = (action: "add" | "remove") => {
    if (action === "add") {
      ctx.dispatch(setSelectedNewUserStores(filtered));
    } else {
      ctx.dispatch(
        setSelectedNewUserStores(
          ctx.selectedNewUserStores.filter(
            (s) =>
              !filtered.some(
                (f) => f.storeid === s.storeid && f.base_group === s.base_group,
              ),
          ),
        ),
      );
    }
  };

  const canContinue = ctx.selectedNewUserStores.length > 0;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ctx.selectedBaseGroups.map((bg) => (
          <button
            key={bg.id}
            onClick={() => handleBGFilterSelect(bg.id)}
            className={`text-[11px] px-3 py-1 rounded-full ${selectedBG === bg.id ? "bg-[#1e2a4a] text-custom-white" : "bg-custom-white border border-gray-200 text-content"}`}
          >
            {bg.name}
          </button>
        ))}
        <button
          onClick={() => setShowSelected((v) => !v)}
          className={`text-[11px] px-3 py-1 rounded-full ${showSelected ? "bg-[#1e2a4a] text-custom-white" : "bg-custom-white border border-gray-200 text-content"}`}
        >
          Selected only
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => handleSelectAll("add")}
          className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 text-white"
        >
          Add all
        </button>
        <button
          onClick={() => handleSelectAll("remove")}
          className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-600/85 text-white"
        >
          Remove all
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto thin-scrollbar border border-gray-100 rounded-lg">
        {filtered.map((s) => {
          const bg = ctx.selectedBaseGroups.find((b) => b.id === s.base_group);
          const isSelected = ctx.selectedNewUserStores.some(
            (store) =>
              store.storeid === s.storeid && store.base_group === s.base_group,
          );
          return (
            <div
              key={`${s.storeid}-${s.base_group}`}
              onClick={() => handleStoreSelect(s)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-gray-100 cursor-pointer ${
                isSelected
                  ? "bg-[#1e2a4a] text-custom-white"
                  : "hover:bg-gray-50 text-content"
              }`}
            >
              <div className="flex justify-between">
                <span className="truncate">{s.store_name}</span>
                <span className="opacity-75">{bg?.name}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">
            No stores found
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="text-[10px] text-content">
          {ctx.selectedNewUserStores.length} stores selected
        </div>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-white ${canContinue ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepStores;
