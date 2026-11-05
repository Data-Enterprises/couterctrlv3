import type { Dispatch, SetStateAction } from "react";

interface FinancialsStorePickerProps {
  /** Every store the ledger returned. */
  stores: { storeid: number; store_number: string; store_name: string }[];
  /** The store this popup is about: "Just this one". */
  storeId: number;
  ticked: Set<number>;
  setTicked: Dispatch<SetStateAction<Set<number>>>;
}

const FinancialsStorePicker = ({
  stores,
  storeId,
  ticked,
  setTicked,
}: FinancialsStorePickerProps) => {
  const tickedCount = ticked.size;
  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
          Stores
        </span>
        <span className="text-[10px] font-semibold text-content">
          {tickedCount} of {stores.length}
        </span>
        <button
          onClick={() => setTicked(new Set(stores.map((st) => st.storeid)))}
          className="text-[10px] font-semibold text-content/85 hover:underline"
        >
          All
        </button>
        <button
          onClick={() => setTicked(new Set([storeId]))}
          className="text-[10px] font-semibold text-content/85 hover:underline"
        >
          Just this one
        </button>
      </div>
      <div className="max-h-[132px] overflow-y-auto thin-scrollbar rounded-md border border-gray-100 bg-custom-white">
        {stores.map((st) => (
          <label
            key={st.storeid}
            className="flex items-center gap-2 px-2 py-1 text-[11.5px] text-content cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={ticked.has(st.storeid)}
              onChange={() =>
                setTicked((prev) => {
                  const n = new Set(prev);
                  n.has(st.storeid) ? n.delete(st.storeid) : n.add(st.storeid);
                  return n;
                })
              }
              className="h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
            />
            <span className="tabular-nums font-semibold w-[46px] flex-shrink-0">
              {st.store_number}
            </span>
            <span className="truncate">{st.store_name}</span>
          </label>
        ))}
      </div>
      {tickedCount === 0 && (
        <p className="text-[10.5px] font-semibold text-severity_watch_text mt-1">
          Pick at least one store.
        </p>
      )}
    </div>
  );
};

export default FinancialsStorePicker;
