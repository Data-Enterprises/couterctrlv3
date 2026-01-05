import type { Store } from "../../../interfaces";
import { useResizeContext } from "../../forecast/hooks";

interface SelectedStoreListProps {
  selectedStores: Store[];
  radioId: number;
  className?: string;
  gridCols?: string;
}

const SelectedStoreList = ({
  selectedStores,
  radioId,
  className = "px-4",
  gridCols = "grid-cols-3",
}: SelectedStoreListProps) => {
  const { height } = useResizeContext("large");
  return (
    <div className={`${className} w-full`}>
      <h3 className="text-sm text-content/70 font-medium">
        Selected {radioId === 1 ? "Stores" : "Group"}
      </h3>
      <div
        className={`${height} py-1 overflow-y-auto no-scrollbar bg-panel_active/15 px-1 rounded-lg shadow w-full`}
      >
        <ul className={`grid ${gridCols} gap-1`}>
          {selectedStores.map((store) => (
            <li key={store.storeid} className="w-full text-xs font-medium">
              {store.store_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SelectedStoreList;
