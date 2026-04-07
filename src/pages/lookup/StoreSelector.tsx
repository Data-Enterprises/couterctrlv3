import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../hooks";
import { setSelectedStore } from "../../features/itemLookupSlice";
import Modal from "../../components/Modal";
import type { Store } from "../../interfaces";

const StoreSelector = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const { selectedStore, itemsLoaded } = useAppSelector(
    (state) => state.item
  );
  const dispatch = useDispatch();
  const { assignedStores } = useAppSelector((state) => state.user);

  useEffect(() => {
    // Filter stores based on search text
    if (searchText.length) {
      const copy = assignedStores.filter((store) =>
        store.store_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStores(copy);
    } else {
      // set the default if no search text
      setFilteredStores([...assignedStores]);
    }
  }, [searchText]);

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
      <Modal className="px-12 -ml-12" isOpen={isOpen} onClose={handleClose}>
        <div className="-mt-2 mb-2">
          <label className="text-xs font-medium">Search stores:</label>
          <input
            data-testid="lookup-store-input"
            id="store-search"
            type="text"
            className="basic-input py-1.5"
            onChange={handleChange}
            value={searchText}
          />
        </div>
        <div className="h-96 max-h-96 text-sm overflow-y-auto rounded-lg no-scrollbar">
          {filteredStores.map((store, i) => (
            <div
              key={i}
              data-testid={`lookup-store-option-${store.storeid}`}
              className={`transition-all duration-200 px-2 py-1 cursor-pointer 
                hover:bg-blue-500 hover:text-custom-white ${
                selectedStore === store.storeid
                  ? "bg-blue-500 text-custom-white"
                  : "even:bg-blue-200 "
              }`}
              onClick={() => handleSelect(store.storeid)}
            >
              {store.store_name}
            </div>
          ))}
        </div>
      </Modal>
      {!itemsLoaded ? (
        <button
          data-testid="lookup-select-store"
          className="btn-themeBlue mt-2 w-full"
          onClick={() => setIsOpen(true)}
        >
          {!selectedStore ? "Select Store" : "Change Store"}
        </button>
      ) : null}
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

export default StoreSelector;
