import { useAppSelector } from "../../../hooks";

const SelectedStoreList = () => {
  const { selectedStores, radioId } = useAppSelector((state) => state.upc);

  return (
    <div className="px-4 w-full">
      <div className="min-h-28 max-h-28 overflow-y-auto bg-panel_active/15 px-2 rounded-lg shadow w-full">
        <h3 className="text-sm text-content/70">
          Selected {radioId === 1 ? "Stores" : "Group"}
        </h3>
        <ul className="grid grid-cols-3">
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
