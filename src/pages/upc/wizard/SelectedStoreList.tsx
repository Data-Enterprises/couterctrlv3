import type { Store } from "../../../interfaces";

interface SelectedStoreListProps {
  selectedStores: Store[];
  radioId: number;
  className?: string;
  gridCols?: string;
  height?: string;
}

const SelectedStoreList = ({
  selectedStores,
  radioId,
  className = "px-4",
  gridCols = "grid-cols-3",
  height = "min-h-20 max-h-20",
}: SelectedStoreListProps) => {
  return (
    <div className={`${className} w-full`}>
      <h3 className="text-sm text-content/70 font-medium">
        Selected {radioId === 1 ? "Stores" : "Group"}
      </h3>
      <div
        className={`${height} overflow-y-auto no-scrollbar bg-panel_active/15 px-2 rounded-lg shadow w-full`}
      >
        <ul className={`grid ${gridCols} `}>
          {selectedStores.map((store) => (
            <li key={store.storeid} className="w-full text-sm">
              {store.store_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SelectedStoreList;
