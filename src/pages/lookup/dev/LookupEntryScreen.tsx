import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { CameraIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import SingleStoreSearchCard from "../../../components/SingleStoreSearchCard";
import { setSelectedStore } from "../../../features/itemLookupSlice";
import DevUpcScanner from "./DevUpcScanner";
import RecentLookupsStrip from "./RecentLookupsStrip";

interface LookupEntryScreenProps {
  onSearch: (upc: string) => void;
  onSelectRecent: (productCode: string) => void;
}

/**
 * Item Lookup's landing screen.
 *
 * Built on the same `SingleStoreSearchCard` every other mobile page opens with,
 * so the first thing a user sees is the card they already know rather than a
 * page-specific form. No navy header: nothing has been searched yet, so there
 * is no store, week or result for a header to name.
 *
 * What is specific to this page — the scanner, the manual UPC field and the
 * recent list — rides in the card's `children` slot beneath its search button.
 * The card's own date picker is omitted; a lookup takes a code, not a date.
 */
const LookupEntryScreen = ({
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

  const handleManualSearch = () => {
    if (!manualUpc.trim() || !hasStore) return;
    onSearch(manualUpc.trim());
  };

  const handleScan = (upc: string) => {
    setCameraOpen(false);
    onSearch(upc);
  };

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto">
      <div className="mx-4 pt-4 pb-2">
        <SingleStoreSearchCard
          title="Item Lookup"
          description="Pick a store, then scan a barcode or enter a UPC."
          buttonLabel="Search"
          stores={assignedStores}
          selectedStoreId={selectedStore}
          onStoreSelect={(id) => dispatch(setSelectedStore(Number(id)))}
          onSearch={handleManualSearch}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-content/15" />
            <span className="text-[10.5px] text-content/85">
              or scan the barcode
            </span>
            <div className="flex-1 h-px bg-content/15" />
          </div>

          <input
            type="text"
            value={manualUpc}
            onChange={(e) => setManualUpc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            placeholder="UPC or product code"
            className="basic-input bg-custom-white w-full py-1.5 text-[13px]"
          />

          <div className="relative">
            {cameraOpen ? (
              <>
                <DevUpcScanner handleScan={handleScan} retryKey={retryKey} />
                <button
                  className="mt-1.5 text-[11.5px] text-content/85 underline"
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
                      Hold steady and try again, or enter the code above.
                    </p>
                    <button
                      className="w-full bg-[#1e2a4a] text-custom-white text-[11.5px] rounded-md py-1.5"
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
                className="w-full flex items-center justify-center gap-2 border border-[#1e2a4a] disabled:border-content/20 disabled:text-content/20 text-[#1e2a4a] text-[13px] font-medium rounded-lg py-2"
              >
                <CameraIcon className="w-4 h-4" />
                Scan barcode
              </button>
            )}
          </div>
        </SingleStoreSearchCard>

        <div className="mt-3">
          <RecentLookupsStrip onSelect={onSelectRecent} variant="list" />
        </div>
      </div>
    </div>
  );
};

export default LookupEntryScreen;
