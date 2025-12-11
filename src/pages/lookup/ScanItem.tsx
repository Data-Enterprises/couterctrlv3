import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../hooks";
import {
  setUpcCode,
  setSelectedStore,
} from "../../features/itemLookupSlice";
import Modal from "../../components/Modal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { type StoreList } from "../../features/itemLookupSlice";

interface ScanItemProps {
  scanItem: () => void;
}

const ScanItem = ({ scanItem }: ScanItemProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [filteredStores, setFilteredStores] = useState<StoreList[]>([]);
  const { upcCode, storeList, selectedStore, itemsLoaded } =
    useAppSelector((state) => state.item);
  const dispatch = useDispatch();

  useEffect(() => {
    // Filter stores based on search text
    if (searchText.length) {
      const copy = storeList.filter((store) =>
        store.store_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStores(copy);
    } else {
      // set the default if no search text
      setFilteredStores([...storeList]);
    }
  }, [searchText, storeList]);

  const handleScan = () => {
    scanItem();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelect = (id: number) => {
    dispatch(setSelectedStore(id));
    handleClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <div className="mb-1">
      <Modal className="px-12" isOpen={isOpen} onClose={handleClose}>
        <div className="-mt-2 mb-2">
          <label className="text-xs font-medium">Search stores:</label>
          <input
            data-testid="lookup-store-input"
            id="store-search"
            type="text"
            className="basic-input"
            onChange={handleChange}
            value={searchText}
          />
        </div>
        <div className="h-96 max-h-96 overflow-y-auto rounded-lg">
          {storeList.length ? (
            filteredStores.map((store, i) => (
              <div
                key={i}
                className={`transition-all duration-200 px-2 py-1 ${
                  selectedStore === store.storeid
                    ? "bg-blue-500 text-custom-white"
                    : "even:bg-blue-200 "
                }`}
                onClick={() => handleSelect(store.storeid)}
              >
                {store.store_name}
              </div>
            ))
          ) : (
            <LoadingIndicator message="Loading stores..." />
          )}
        </div>
      </Modal>
      <div className="text-sm font-medium">Scan item:</div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          data-testid="scan-item-input"
          value={upcCode}
          onChange={(e) => dispatch(setUpcCode(e.target.value))}
          className="basic-input bg-custom-white"
        />
        <button
          data-testid="scan-button"
          onClick={handleScan}
          className="btn-themeBlue px-4"
        >
          Scan
        </button>
      </div>
      {!itemsLoaded && (
        <button
          data-testid="lookup-select-store"
          className="btn-themeBlue mt-2 w-full"
          onClick={() => setIsOpen(true)}
        >
          {!selectedStore ? "Select Store" : "Change Store"}
        </button>
      )}
      {selectedStore && !itemsLoaded ? (
        <button
          data-testid="scan-item-clear-store"
          className="btn-themeOrange mt-2 w-full"
          onClick={() => dispatch(setSelectedStore(0))}
        >
          Clear Store
        </button>
      ) : null}
    </div>
  );
};

export default ScanItem;
