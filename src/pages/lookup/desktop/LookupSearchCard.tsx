import Input from "../../../components/inputs/Input";
import SingleSelect from "../../../components/SingleSelect";
import {
  reQueryUpc,
  setSelectedStore,
  setUpcCode,
} from "../../../features/itemLookupSlice";
import { setError } from "../../../features/itemScanSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

interface LookupSearchCardProps {
  getItemData: (upc: string) => void;
}

const LookupSearchCard = ({ getItemData }: LookupSearchCardProps) => {
  const dispatch = useAppDispatch();
  const { assignedStores } = useAppSelector((state) => state.user);
  const { upcCode, selectedStore } = useAppSelector((state) => state.item);
  const { error } = useAppSelector((state) => state.itemScan);

  const handleStoreSelect = (id: string | number) => {
    dispatch(setSelectedStore(Number(id)));
  };

  const findStoreName = () => {
    const store = assignedStores.find((s) => s.storeid === selectedStore);
    return store ? store.store_name : "";
  };

  const handleUpcCodeChange = (value: string) => {
    dispatch(setUpcCode(value));
  };

  const clear = () => {
    dispatch(reQueryUpc({ isResettingUpcCode: true }));
    dispatch(setUpcCode(""));
    dispatch(setError(""));
  };

  return (
    <div>
      <div className="bg-custom-white p-2 rounded-lg shadow-lg space-y-2">
        <SingleSelect
          label="Store"
          data={assignedStores}
          displayKey="store_name"
          valueKey="storeid"
          onSelect={handleStoreSelect}
          defaultQuery={`${selectedStore > 0 ? findStoreName() : ""}`}
          innerClass="text-sm py-1.5"
          listClass="text-sm"
        />
        <Input
          label="UPC"
          value={upcCode}
          setValue={handleUpcCodeChange}
          className="py-1 text-[13px]"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-themeGreen px-0 py-1 text-[13px]"
            onClick={() => getItemData(upcCode)}
          >
            Search
          </button>
          <button
            className="btn-themeOrange px-0 py-1 text-[13px]"
            onClick={clear}
          >
            Clear
          </button>
        </div>
        {error && <p className="text-red-500 text-[11px] font-medium text-center">{error}</p>}
      </div>
    </div>
  );
};

export default LookupSearchCard;
