import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import SingleSelect from "../../../../components/SingleSelect";
import { setSelectedStore } from "../../../../features/itemLookupSlice";

interface LookupDesktopEntryProps {
  onSearch: (upcs: string[]) => void;
}

const parseUpcs = (raw: string): string[] =>
  raw
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

const LookupDesktopEntry = ({ onSearch }: LookupDesktopEntryProps) => {
  const dispatch = useAppDispatch();
  const { assignedStores } = useAppSelector((s) => s.user);
  const { selectedStore } = useAppSelector((s) => s.item);
  const [rawUpcs, setRawUpcs] = useState("");

  const handleStoreSelect = (id: string | number) => {
    dispatch(setSelectedStore(Number(id)));
  };

  const upcs = parseUpcs(rawUpcs);
  const canSearch = selectedStore > 0 && upcs.length > 0;

  const handleSubmit = () => {
    if (!canSearch) return;
    onSearch(upcs);
  };

  return (
    <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-content">Item lookup</h2>
        <p className="text-[12px] text-content/50 mt-1">
          Search for an item by UPC, or paste several to look them up at once.
        </p>
      </div>

      <SingleSelect
        label="Store"
        data={assignedStores}
        displayKey="store_name"
        valueKey="storeid"
        onSelect={handleStoreSelect}
        innerClass="text-sm py-1.5"
        listClass="text-sm"
      />

      <div>
        <label className="text-[11px] font-medium text-content/60 ml-0.5">UPCs</label>
        <textarea
          value={rawUpcs}
          onChange={(e) => setRawUpcs(e.target.value)}
          placeholder="Paste one or more UPCs"
          rows={4}
          className="basic-input bg-custom-white w-full mt-1 py-2 px-2.5 text-[13px] resize-none"
          style={{ outline: "none" }}
        />
        <p className="text-[10.5px] text-content/45 mt-1">
          Separate multiple UPCs with commas or new lines
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSearch}
        className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
      >
        {upcs.length > 1 ? `Look up ${upcs.length} items` : "Search"}
      </button>
    </div>
  );
};

export default LookupDesktopEntry;
