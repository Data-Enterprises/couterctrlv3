import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { CameraIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import SingleSelect from "../../../components/SingleSelect";
import { setSelectedStore } from "../../../features/itemLookupSlice";
import DevUpcScanner from "./DevUpcScanner";
import RecentLookupsStrip from "./RecentLookupsStrip";

interface LookupEntryScreenProps {
  storeName: string;
  onSearch: (upc: string) => void;
  onSelectRecent: (productCode: string) => void;
}

const LookupEntryScreen = ({
  storeName,
  onSearch,
  onSelectRecent,
}: LookupEntryScreenProps) => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((s) => s.itemScan);
  const { assignedStores } = useAppSelector((s) => s.user);
  const { selectedStore } = useAppSelector((s) => s.item);
  const [manualUpc, setManualUpc] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);

  const hasStore = selectedStore > 0;

  const handleStoreSelect = (id: string | number) => {
    dispatch(setSelectedStore(Number(id)));
  };

  const handleManualSearch = () => {
    if (!manualUpc.trim() || !hasStore) return;
    onSearch(manualUpc.trim());
  };

  const handleScan = (upc: string) => {
    setCameraOpen(false);
    onSearch(upc);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-custom-white">
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="text-[13px] font-semibold text-white">Item lookup</div>
      </div>

      <div className="p-3">
        <SingleSelect
          label="Store"
          data={assignedStores}
          displayKey="store_name"
          valueKey="storeid"
          onSelect={handleStoreSelect}
          defaultQuery={storeName}
          innerClass="text-[13px] py-1.5"
          listClass="text-[13px]"
          className="mb-3.5"
        />

        {!hasStore && (
          <p className="text-[11px] text-content/50 -mt-2 mb-3.5">
            Select a store to scan or search for an item.
          </p>
        )}

        <div className="relative">
          {cameraOpen ? (
            <>
              <DevUpcScanner handleScan={handleScan} retryKey={retryKey} />
              <button
                className="mt-1.5 text-[11.5px] text-content/50 underline"
                onClick={() => setCameraOpen(false)}
              >
                Close camera
              </button>
              {error.length > 0 && (
                <div className="absolute left-2 right-2 bottom-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-700" />
                    <span className="text-[12px] font-medium text-red-800">
                      Couldn't read that clearly
                    </span>
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5 mb-2">
                    Hold steady and try again, or enter the code below.
                  </p>
                  <button
                    className="w-full bg-[#1e2a4a] text-white text-[11.5px] rounded-md py-1.5"
                    onClick={() => setRetryKey((k) => k + 1)}
                  >
                    Try scanning again
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              disabled={!hasStore}
              onClick={() => setCameraOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#1e2a4a] disabled:bg-content/20 text-white text-[13px] font-medium rounded-xl py-3"
            >
              <CameraIcon className="w-4 h-4" />
              Scan barcode
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 my-3.5">
          <div className="flex-1 h-px bg-content/15" />
          <span className="text-[10.5px] text-content/45">
            or enter manually
          </span>
          <div className="flex-1 h-px bg-content/15" />
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          <input
            type="text"
            value={manualUpc}
            onChange={(e) => setManualUpc(e.target.value)}
            placeholder="UPC or product code"
            className="basic-input bg-custom-white flex-1 py-1.5 text-[13px]"
          />
          <button
            disabled={!hasStore}
            className="bg-[#1e2a4a] disabled:bg-content/20 text-white text-[13px] px-4 py-1.5 rounded-md"
            onClick={handleManualSearch}
          >
            Search
          </button>
        </div>

        <RecentLookupsStrip onSelect={onSelectRecent} />
      </div>
    </div>
  );
};

export default LookupEntryScreen;
